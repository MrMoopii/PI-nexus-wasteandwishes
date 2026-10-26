import React from 'react';

export default function AdminEventPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Data Event</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Ini adalah halaman untuk mengelola data event pada Admin Panel.
        </p>
        {/* Nantinya Anda bisa menambahkan tabel Drizzle ORM atau komponen form di sini */}
      </div>
    </div>
  );
}