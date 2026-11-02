"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function ProfileDropdown({ username }: { username: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-teal-600 text-lg font-bold"
        aria-label="Menu profil"
        aria-expanded={isOpen}
      >
        {username.slice(0, 1).toUpperCase()}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-20 mt-3 w-56 rounded-xl bg-white p-4 text-center text-gray-900 shadow-xl">
          <p className="font-bold">{username}</p>
          <hr className="my-3 border-gray-200" />
          <Link
            className="block py-2 text-gray-600"
            href="/profil"
            onClick={() => setIsOpen(false)}
          >
            Profil Saya
          </Link>
          <Link
            className="block py-2 font-bold text-red-600"
            href="/auth/logout"
            onClick={() => setIsOpen(false)}
          >
            Keluar
          </Link>
        </div>
      )}
    </div>
  );
}
