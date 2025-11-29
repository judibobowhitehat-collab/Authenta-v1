import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Invention, User } from "../types";

export const generateCertificate = async (invention: Invention, user: User, customRecipient?: string) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  // Background Color
  doc.setFillColor(15, 23, 42); // Dark Blue #0f172a
  doc.rect(0, 0, 297, 210, "F");

  // Border
  doc.setDrawColor(0, 243, 255); // Neon Cyan
  doc.setLineWidth(1);
  doc.rect(10, 10, 277, 190);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, 273, 186);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text("CERTIFICATE OF AUTHENTICITY", 148.5, 40, { align: "center" });

  // Subtitle
  doc.setFontSize(14);
  doc.setTextColor(0, 243, 255); // Neon Cyan
  doc.text("SECURED & VERIFIED BY AUTHENTA", 148.5, 50, { align: "center" });

  // Content
  doc.setTextColor(226, 232, 240); // Slate 200
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const startY = 80;
  const lineHeight = 12;

  // ISSUED TO (Customizable)
  const recipientName = customRecipient || user.name || user.email || "Authorized Owner";
  doc.text(`Issued To:`, 40, startY);
  doc.setFont("helvetica", "bold");
  doc.text(recipientName, 90, startY);

  doc.setFont("helvetica", "normal");
  doc.text(`Invention Title:`, 40, startY + lineHeight);
  doc.setFont("helvetica", "bold");
  doc.text(`${invention.title}`, 90, startY + lineHeight);

  doc.setFont("helvetica", "normal");
  doc.text(`License Type:`, 40, startY + lineHeight * 2);
  doc.setFont("helvetica", "bold");
  doc.text(`${invention.license}`, 90, startY + lineHeight * 2);

  doc.setFont("helvetica", "normal");
  doc.text(`File Name:`, 40, startY + lineHeight * 3);
  doc.text(`${invention.fileName}`, 90, startY + lineHeight * 3);

  doc.text(`Registration Date:`, 40, startY + lineHeight * 4);
  doc.text(`${invention.createdAt ? new Date(invention.createdAt.seconds * 1000).toDateString() : "Pending"}`, 90, startY + lineHeight * 4);

  // Blockchain Info (if available)
  if (invention.blockchainTxHash) {
    doc.setTextColor(0, 243, 255);
    doc.text(`Blockchain Anchor:`, 40, startY + lineHeight * 6);
    doc.setFont("courier", "normal");
    doc.setFontSize(10);
    doc.text(`${invention.blockchainTxHash}`, 90, startY + lineHeight * 6);
  }

  // Hash Box
  doc.setDrawColor(255, 255, 255);
  doc.setFillColor(30, 41, 59); // Card BG
  doc.rect(40, 160, 217, 20, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text("DIGITAL FINGERPRINT (SHA-256)", 42, 165);
  
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 243, 255);
  doc.text(invention.hash, 42, 175);

  // QR Code Generation
  try {
    const qrData = JSON.stringify({
      id: invention.id,
      hash: invention.hash,
      owner: user.uid,
      platform: "Authenta"
    });
    const qrUrl = await QRCode.toDataURL(qrData);
    doc.addImage(qrUrl, "PNG", 220, 70, 40, 40);
  } catch (err) {
    console.error("QR Gen Error", err);
  }

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Certificate ID: ${invention.id} | Generated: ${new Date().toISOString()}`, 148.5, 195, { align: "center" });

  doc.save(`Authenta_Cert_${invention.fileName}.pdf`);
};