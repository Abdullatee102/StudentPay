const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  size: 'A4',
  margin: 40,
  info: {
    Title: 'StudentPay Escrow — Official White Paper & Pitch Deck',
    Author: 'StudentPay Team',
    Subject: 'DeFi & Web3 Student Escrow Architecture'
  }
});

const outputPath = path.resolve(__dirname, '../frontend/public/docs/studentpay-whitepaper.pdf');
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Styles & Colors
const primaryColor = '#6366F1';
const darkBg = '#0F0F13';
const textColor = '#1E293B';
const mutedColor = '#64748B';

// Header
doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text('StudentPay Escrow', { align: 'left' });
doc.fontSize(12).font('Helvetica').fillColor(mutedColor).text('Trustless Peer-to-Peer Student Micro-Services Escrow on Bohr Testnet', { align: 'left' });
doc.moveDown(0.5);

doc.fontSize(9).fillColor('#475569').text('Contract Address: 0x7591428059DcAD6De8D51177080959F8B347603D | Chain ID: 968 | Token: BOT');
doc.moveDown(1);
doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
doc.moveDown(1);

function addSection(title, content) {
  if (doc.y > 680) doc.addPage();
  doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor).text(title);
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor(textColor).text(content, { lineGap: 3 });
  doc.moveDown(1);
}

addSection('1. The Problem', 
  'Students frequently exchange services with peers for tutoring, design work, software development, video editing, essay proofreading, and campus events. Traditional agreements carry high risks: buyers paying upfront risk sellers disappearing; sellers delivering work risk buyers withholding funds; and digital assets are often stolen prior to payment. Traditional escrow solutions charge 10-20% fees and rely on centralized servers.'
);

addSection('2. The Opportunity',
  'Higher education campuses host thriving micro-economies. A non-custodial, zero-commission escrow application enables students to monetize skills safely without trusting unknown counterparties or relying on centralized banking intermediaries.'
);

addSection('3. The StudentPay Solution',
  'StudentPay eliminates counterparty risk using EVM smart contracts on the Bohr Testnet:\n' +
  '• Zero Centralized Backend: The smart contract handles 100% of business logic and state.\n' +
  '• Blinded Proof Commitments: Sellers submit keccak256 hashes before deadlines to prevent work-stealing.\n' +
  '• Protected Preview Inspection: Buyers inspect watermarked previews (STUDENTPAY • PREVIEW ONLY) while usable originals remain locked.\n' +
  '• Anti-Ghosting Safeguard: Automatic 100% payout triggers if 48 hours pass without buyer dispute.'
);

addSection('4. How StudentPay Works (5-Step Core Flow)',
  '1. CREATE DEAL: Buyer locks BOT tokens in smart contract escrow.\n' +
  '2. SELLER SUBMITS: Seller submits deliverable & records keccak256 hash on-chain.\n' +
  '3. BUYER INSPECTS: Buyer views watermarked protected preview; original remains locked.\n' +
  '4. ACCEPT OR DISPUTE: Buyer accepts and releases funds, or opens a dispute within 48 hours.\n' +
  '5. DELIVERABLE UNLOCKS: Original downloadable deliverable unlocks post-release.'
);

addSection('5. Core Implemented Features',
  '• Blinded Proof Commitment (keccak256 on-chain verification)\n' +
  '• Dual-Level Access Control (Watermarked Preview vs. Original Asset Unlock)\n' +
  '• 48-Hour Review & Dispute Window\n' +
  '• Anti-Ghosting Auto-Release Payouts\n' +
  '• Immediate Deadline Refund Guarantees'
);

addSection('6. Technical Architecture & Technology Stack',
  'Frontend: React 18, Vite 6, TypeScript 5.6, wagmi 2.x, viem 2.x, Reown AppKit, TanStack Query.\n' +
  'Blockchain: Bohr Testnet (Chain ID 968, BOT Native Token), StudentPayEscrow.sol (Solidity 0.8.24).\n' +
  'Testing & Security: 21 passing Foundry/Forge unit & integration tests. Non-custodial, reentrancy-guarded smart contract architecture.'
);

addSection('7. Product Status & Roadmap',
  'Current Status: Deployed V2 Smart Contract (0x7591428059DcAD6De8D51177080959F8B347603D), complete dApp, 21 passing tests.\n' +
  'Future Roadmap: IPFS decentralized storage integration, multi-token ERC-20 support, partial milestone releases, and mainnet deployment.'
);

// Footer
doc.fontSize(8).fillColor(mutedColor).text('StudentPay Escrow · Built with Foundry + React + Reown AppKit · Bohr Testnet', 40, 780, { align: 'center' });

doc.end();

writeStream.on('finish', () => {
  console.log('PDF GENERATED SUCCESSFULLY AT:', outputPath);
});

