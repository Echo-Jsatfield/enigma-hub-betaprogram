import { motion } from "framer-motion";
import React from "react";

export default function EnigmaButton({ children, onClick, className = "", type = "button" }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{
        backgroundColor: "#ffd633",
        boxShadow: "0 0 12px #f8cc00aa",
      }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      onClick={onClick}
      type={type}
      className={`bg-[#f8cc00] text-[#18122b] font-semibold py-2 rounded-md transition-all shadow-md border border-transparent hover:border-[#f8cc00]/50 ${className}`}
    >
      {children}
    </motion.button>
  );
}
