import { db, auth } from "../firebaseConfig";
import { collection, addDoc, query, where, getDocs, serverTimestamp, doc, updateDoc, arrayUnion, getDoc, deleteDoc } from "firebase/firestore";
import { Invention, Collaborator, Version, VaultItem } from "../types";

// --- HELPER: Convert Blob to Base64 Data URI ---
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert blob to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- DIAGNOSTIC TOOL ---
// Use this to check if Firestore rules are blocking writes
export const testDatabaseConnection = async () => {
  try {
    const testCol = collection(db, "_connection_test");
    await addDoc(testCol, {
      timestamp: serverTimestamp(),
      test: "connection_check",
      uid: auth.currentUser?.uid || "anon",
      deviceTime: new Date().toString()
    });
    console.log("Diagnostic Write Successful");
    return { success: true, message: "Connection Verified: Write Access Granted" };
  } catch (error: any) {
    console.error("Diagnostic Write Failed:", error);
    let msg = error.message;
    if (error.code === 'permission-denied') {
      msg = "PERMISSION DENIED: Check your Firebase Firestore Rules. They may be expired or too restrictive.";
    }
    return { success: false, message: msg };
  }
};

export const uploadInvention = async (
  userId: string,
  file: Blob,
  meta: { title: string; description: string; fileName: string; hash: string; iv: string; license: string; accessHash?: string },
  onProgress?: (progress: number) => void
) => {
  return new Promise<string>(async (resolve, reject) => {
    console.log("Starting upload for:", meta.fileName);
    
    try {
      // 1. Convert Blob to Base64 String
      if (onProgress) onProgress(10); // Started conversion
      const base64String = await blobToBase64(file);
      if (onProgress) onProgress(50); // Conversion done, starting DB write

      // 2. Save Metadata AND File Data to Firestore
      // NOTE: Firestore has a 1MB limit. Large base64 strings will fail here.
      const docRef = await addDoc(collection(db, "inventions"), {
        userId,
        title: meta.title,
        description: meta.description,
        fileName: meta.fileName,
        storagePath: "firestore_base64", // Legacy field
        fileSize: file.size,
        fileType: file.type,
        fileUrl: base64String, // Storing the actual data here now
        hash: meta.hash,
        iv: meta.iv,
        license: meta.license,
        accessHash: meta.accessHash || null, // Store password hash if provided
        createdAt: serverTimestamp(),
        isPublic: false,
        collaborators: [],
        versions: []
      });

      if (onProgress) onProgress(100);
      console.log("Data saved to Firestore:", docRef.id);
      resolve(docRef.id);
    } catch (dbError) {
      console.error("Firestore Save Failed:", dbError);
      reject(dbError);
    }
  });
};

export const getUserInventions = async (userId: string): Promise<Invention[]> => {
  try {
    const q = query(
      collection(db, "inventions"), 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invention));

    // Client-side sort (Newest first)
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Fetch failed", error);
    return [];
  }
};

export const deleteInvention = async (id: string) => {
  try {
    await deleteDoc(doc(db, "inventions", id));
  } catch (error) {
    console.error("Delete failed", error);
    throw error;
  }
};

// --- NEW FEATURES ---

export const getPublicInventions = async (): Promise<Invention[]> => {
  try {
    const q = query(
      collection(db, "inventions"), 
      where("isPublic", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Invention));

    // Client-side sort
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Fetch public failed", error);
    return [];
  }
};

export const updateInvention = async (id: string, updates: Partial<Invention>) => {
  const docRef = doc(db, "inventions", id);
  await updateDoc(docRef, updates);
};

export const addCollaborator = async (inventionId: string, email: string) => {
  const docRef = doc(db, "inventions", inventionId);
  const newCollab: Collaborator = {
    email,
    role: 'viewer',
    addedAt: new Date().toISOString(),
    status: 'offline'
  };
  await updateDoc(docRef, {
    collaborators: arrayUnion(newCollab)
  });
};

/**
 * Uploads a new version of the invention.
 * LOGIC:
 * 1. Converts new file to Base64.
 * 2. Archives the CURRENT main file details into the 'versions' array.
 * 3. Updates the main file details with the NEW file.
 */
export const uploadVersion = async (inventionId: string, file: File, hash: string, iv: string) => {
  const docRef = doc(db, "inventions", inventionId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) throw new Error("Invention not found");
  const currentData = docSnap.data() as Invention;

  // 1. Convert new file to Base64
  const base64String = await blobToBase64(file);

  // 2. Archive current version to history
  const archivedVersion: Version = {
    versionNumber: Date.now(), // Use timestamp as ID
    fileName: currentData.fileName,
    fileUrl: currentData.fileUrl,
    hash: currentData.hash,
    iv: currentData.iv,
    createdAt: new Date().toISOString()
  };

  // 3. Update main doc with new version and add old to history
  await updateDoc(docRef, {
    fileName: file.name,
    fileSize: file.size,
    fileUrl: base64String, // New Base64 data
    hash: hash,
    iv: iv,
    versions: arrayUnion(archivedVersion),
    updatedAt: serverTimestamp()
  });
};

/**
 * Reverts the invention to a previous version.
 * LOGIC:
 * 1. Archives the CURRENT main file details into 'versions'.
 * 2. Overwrites the main file details with the TARGET version details.
 */
export const revertToVersion = async (inventionId: string, version: Version) => {
  const docRef = doc(db, "inventions", inventionId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) throw new Error("Invention not found");
  const currentData = docSnap.data() as Invention;

  // 1. Archive current head to history so we don't lose it
  const archivedCurrent: Version = {
     versionNumber: Date.now(),
     fileName: currentData.fileName,
     fileUrl: currentData.fileUrl,
     hash: currentData.hash,
     iv: currentData.iv,
     createdAt: new Date().toISOString()
  };

  // 2. Restore target version as main
  await updateDoc(docRef, {
    fileName: version.fileName,
    fileUrl: version.fileUrl,
    hash: version.hash,
    iv: version.iv,
    versions: arrayUnion(archivedCurrent), // Push the replaced head to history
    updatedAt: serverTimestamp()
  });
};

// --- VAULT (CREDENTIAL STORE) ---

export const saveVaultItem = async (item: Omit<VaultItem, 'id'>) => {
  await addDoc(collection(db, "vault_items"), {
    ...item,
    createdAt: serverTimestamp()
  });
};

export const getVaultItems = async (userId: string): Promise<VaultItem[]> => {
  const q = query(collection(db, "vault_items"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VaultItem));
};

export const deleteVaultItem = async (id: string) => {
  await deleteDoc(doc(db, "vault_items", id));
};
