export const STAGES = [
  { key: "Registration Done", label: "Registered", icon: "how_to_reg" },
  { key: "Phone Verification Done", label: "Verified", icon: "verified" },
  { key: "Bank & Finance", label: "Banking", icon: "account_balance" },
  { key: "Sent to Store", label: "Inventory", icon: "inventory_2" },
  { key: "Installation Done", label: "Installed", icon: "construction" },
  { key: "Electrical Verification Done", label: "Electrical", icon: "electrical_services" },
  { key: "Plant Activated", label: "Activated", icon: "bolt" },
  { key: "TQA Verified", label: "TQA", icon: "fact_check" },
  { key: "Final Payment Collection", label: "Final Payment", icon: "account_balance" },
  { key: "Accounts Verified", label: "Accounts", icon: "receipt_long" },
  { key: "Sent to Subsidy", label: "Subsidy", icon: "account_balance_wallet" },
  { key: "Subsidy Registration Completed", label: "Sub. Done", icon: "check_circle" },
  { key: "Completed", label: "Completed", icon: "task_alt" },
];

export const stageIndex = (stage) => {
  const map = {
    "Registration Done": 0,
    "Phone Verification Done": 1,
    "Bank & Finance": 2,
    "Sent to Store": 3,
    "Installation Done": 4,
    "Electrical Verification Done": 5,
    "Plant Activated": 6,
    "TQA Verified": 7,
    "Final Payment Collection": 8,
    "Accounts Verified": 9,
    "Sent to Subsidy": 10,
    "Subsidy Registration Completed": 11,
    Completed: 12,
  };
  return map[stage] ?? -1;
};

export const FEATURES = [
  {
    icon: "sync",
    title: "Live Updates",
    desc: "Real-time status updates as your project moves through each stage of installation.",
  },
  {
    icon: "shield",
    title: "Secure Access",
    desc: "Your personal data stays private. We only show progress — nothing sensitive.",
  },
  {
    icon: "bar_chart",
    title: "Full Visibility",
    desc: "View every milestone from registration to plant activation in one place.",
  },
];
