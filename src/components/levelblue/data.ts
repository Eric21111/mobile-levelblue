import { Quiz, Student, Threat, Unit } from './types';

export const DEMO_STUDENT: Student = {
  email: 'student@levelblue.edu',
  password: 'blue123',
  name: 'Mika Reyes',
  className: 'Cyber Safety 1A',
  avatar: 'MR',
  rankTitle: 'Bronze Defender',
  rankPoints: 420,
  wins: 2,
  gamesPlayed: 5,
  streak: 1,
};

export const UNITS: Unit[] = [
  {
    id: 'firewall',
    name: 'Firewall',
    cost: 50,
    shield: 10,
    icon: 'FW',
    color: '#2A9D9C',
    description: 'Blocks damage when you miss a threat question.',
  },
  {
    id: 'spamfolder',
    name: 'Spam Folder',
    cost: 70,
    shield: 14,
    icon: 'SP',
    color: '#55B9B7',
    description: 'Slows scam messages and protects the base.',
  },
  {
    id: 'guard',
    name: 'Security Guard',
    cost: 150,
    shield: 22,
    icon: 'SG',
    color: '#5FB87A',
    description: 'Stops physical social-engineering attempts.',
  },
  {
    id: 'vault',
    name: 'Password Vault',
    cost: 120,
    shield: 28,
    icon: 'PV',
    color: '#3DA9D6',
    description: 'Adds a strong shield against account attacks.',
  },
  {
    id: 'vpn',
    name: 'VPN Tunnel',
    cost: 140,
    shield: 20,
    icon: 'VPN',
    color: '#4FB6A9',
    description: 'Adds a support shield pulse to the frontline.',
  },
];

export const THREATS: Threat[] = [
  {
    id: 'phish',
    name: 'Phish-Hook',
    domain: 'Technical',
    hp: 2,
    damage: 14,
    color: '#7FA84D',
    icon: 'PH',
    fact: 'Phishing messages often create urgency and imitate a trusted sender.',
  },
  {
    id: 'ransom',
    name: 'Ransom-Worm',
    domain: 'Technical',
    hp: 3,
    damage: 18,
    color: '#D6453D',
    icon: 'RW',
    fact: 'Ransomware locks files. Backups and fast reporting reduce the damage.',
  },
  {
    id: 'tailgater',
    name: 'Tailgater Shadow',
    domain: 'Physical',
    hp: 2,
    damage: 15,
    color: '#7B5FA8',
    icon: 'TS',
    fact: 'Tailgating is entering a secure place by following someone else inside.',
  },
  {
    id: 'usb',
    name: 'USB Lure',
    domain: 'Physical',
    hp: 2,
    damage: 13,
    color: '#F2A93B',
    icon: 'USB',
    fact: 'Unknown USB drives can run malicious code or steal data.',
  },
  {
    id: 'pigbutcher',
    name: 'Trust Trader',
    domain: 'Personal',
    hp: 3,
    damage: 17,
    color: '#D66A3D',
    icon: 'TT',
    fact: 'Long-con investment scams build trust before asking for money.',
  },
];

export const QUIZZES: Quiz[] = [
  {
    id: 'phish-1',
    threatId: 'phish',
    prompt: 'An email says your account closes today unless you click a password link. What is safest?',
    options: [
      { text: 'Click quickly before time runs out', correct: false },
      { text: 'Open the official site yourself and report the email', correct: true },
      { text: 'Reply with your password to verify', correct: false },
    ],
  },
  {
    id: 'ransom-1',
    threatId: 'ransom',
    prompt: 'A computer shows a payment demand to unlock files. What should you do first?',
    options: [
      { text: 'Disconnect from the network and get help', correct: true },
      { text: 'Pay immediately', correct: false },
      { text: 'Ignore it and keep working', correct: false },
    ],
  },
  {
    id: 'tailgater-1',
    threatId: 'tailgater',
    prompt: 'Someone without a badge follows you into a secure room. What is the right move?',
    options: [
      { text: 'Let them in to be polite', correct: false },
      { text: 'Ask them to badge in or visit reception', correct: true },
      { text: 'Hold the door and walk away', correct: false },
    ],
  },
  {
    id: 'usb-1',
    threatId: 'usb',
    prompt: 'You find a USB drive labeled "Final Exam Answers" in the hallway.',
    options: [
      { text: 'Plug it in to see who owns it', correct: false },
      { text: 'Give it to a teacher or IT without opening it', correct: true },
      { text: 'Open only one file', correct: false },
    ],
  },
  {
    id: 'pigbutcher-1',
    threatId: 'pigbutcher',
    prompt: 'An online friend promises guaranteed crypto profit after weeks of chatting.',
    options: [
      { text: 'Send a small amount to test it', correct: false },
      { text: 'Decline and verify independently', correct: true },
      { text: 'Borrow money to join faster', correct: false },
    ],
  },
  {
    id: 'phish-2',
    threatId: 'phish',
    prompt: 'Which sign is the strongest red flag?',
    options: [
      { text: 'A strange sender, urgent wording, and a login link', correct: true },
      { text: 'A message from a teacher you know', correct: false },
      { text: 'A school newsletter with no links', correct: false },
    ],
  },
];

export function rankTitleFor(points: number) {
  if (points >= 900) return 'Gold Analyst';
  if (points >= 650) return 'Silver Sentinel';
  return 'Bronze Defender';
}
