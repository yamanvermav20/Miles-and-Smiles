import { useState } from "react";
import { Users } from "lucide-react";
import FriendsModal from "../FriendsModal.jsx";

export default function Friends({ mobileVisible = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const visibility = mobileVisible ? "flex md:hidden" : "hidden md:flex";
  const iconSize = mobileVisible ? 18 : 20;

  return (
    <>
      <div className={`${visibility} items-center`}>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-xl hover:bg-violet-soft transition-all duration-200 active:scale-95"
          title="Friends"
        >
          <Users 
            className="text-text-muted hover:text-violet transition-colors" 
            size={iconSize} 
          />
        </button>
      </div>

      <FriendsModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}
