export default function Home() {
  return (
    <div className="pb-20">
      {/* Hero Banner */}
      <div className="bg-teal-600 text-center text-white flex flex-col justify-center items-center h-80 rounded-b-[3rem] pb-16">
        <h1 className="font-extrabold mb-3 text-4xl sm:text-5xl">
          Tentang Kami
        </h1>
        <p className="text-sm tracking-widest uppercase opacity-90">
          Home &bull; Tentang Kami
        </p>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl -mt-20 relative z-10">
        {/* Cards Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Card 1: Permasalahan */}
          <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-2xl border-t-4 border-teal-600 p-8 text-center flex flex-col items-center">
            <div className="mb-6 flex justify-center items-center w-20 h-20 rounded-full bg-teal-50 text-teal-600 shadow-sm">
              <span className="text-4xl">🗑️</span>
            </div>
            <h4 className="font-bold text-xl mb-3 text-gray-800">
              Permasalahan
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Banyak masyarakat masih bingung mengelola sampah dapur/organik.
              Kami mendesain teknologi informasi sebagai solusi pengelolaan.
            </p>
          </div>

          {/* Card 2: Peluang */}
          <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-2xl border-t-4 border-teal-600 p-8 text-center flex flex-col items-center">
            <div className="mb-6 flex justify-center items-center w-20 h-20 rounded-full bg-teal-50 text-teal-600 shadow-sm">
              <span className="text-4xl">💡</span>
            </div>
            <h4 className="font-bold text-xl mb-3 text-gray-800">Peluang</h4>
            <p className="text-gray-600 text-sm leading-relaxed">
              Peluang besar bagi penyedia layanan budidaya maggot untuk membantu
              masyarakat mengelola limbah dapur.
            </p>
          </div>

          {/* Card 3: Keharusan */}
          <div className="bg-white shadow-md hover:shadow-xl transition-shadow duration-300 rounded-2xl border-t-4 border-teal-600 p-8 flex flex-col items-center text-center">
            <div className="mb-6 flex justify-center items-center w-20 h-20 rounded-full bg-teal-50 text-teal-600 shadow-sm">
              <span className="text-4xl">🎯</span>
            </div>
            <h4 className="font-bold text-xl mb-3 text-gray-800">Keharusan</h4>
            <div className="text-gray-600 text-sm leading-relaxed text-left w-full space-y-2">
              <p>
                <strong className="text-teal-700">1. Edukasi:</strong> Ubah pola
                pikir dari {"\""}membuang{"\""} jadi {"\""}menyediakan bahan baku{"\""}.
              </p>
              <p>
                <strong className="text-teal-700">2. Standar:</strong> Panduan
                memilah sampah dapur.
              </p>
              <p>
                <strong className="text-teal-700">3. Jaringan:</strong>{" "}
                Hubungkan rumah tangga & penyedia secara <i>real-time</i>.
              </p>
            </div>
          </div>
        </div>

        <hr className="mb-16 border-gray-200" />

        {/* Visi & Misi Section */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Visi */}
          <div className="p-8 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col items-center text-center">
            <h4 className="font-bold text-2xl text-teal-700 mb-4 flex items-center gap-2">
              🌍 Visi Kami
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Menjadi pionir platform pengelolaan sampah organik terintegrasi yang
              mewujudkan lingkungan bersih, sehat, dan mendukung ekonomi sirkular
              melalui maggot BSF.
            </p>
          </div>

          {/* Misi */}
          <div className="p-8 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl bg-teal-50 border border-teal-100 flex flex-col justify-center">
            <h4 className="font-bold text-2xl text-teal-700 mb-4 text-center flex items-center justify-center gap-2">
              🚀 Misi Kami
            </h4>
            <ul className="text-gray-700 leading-relaxed space-y-3 list-disc list-outside ml-5">
              <li>Edukasi berkelanjutan terkait pengolahan limbah.</li>
              <li>
                Membangun jaringan <i>real-time</i> masyarakat & penyedia.
              </li>
              <li>Efisiensi pendataan & penjemputan sampah terjadwal.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}