export default function Home() {
  return (
    <>
      {/* Hero Banner */}
      <div className="bg-teal-600 text-center text-white flex flex-col justify-center items-center h-75 rounded-b-[30px] -mb-12.5 pb-12.5">
        <h1 className="font-bold mb-2 text-3xl">Tentang Kami</h1>
        <p className="text-sm tracking-wide opacity-80">Home • Tentang Kami</p>
      </div>

      {/* Cards Section */}
      <div className="container mx-auto py-12">
        <div className="grid md:grid-cols-3 gap-6 relative z-10 mb-12">
          {/* Card 1 */}
          <div className="bg-white shadow rounded-xl border-t-4 border-teal-600 p-6 text-center">
            <div className="mx-auto mb-4 flex justify-center items-center text-teal-600 w-20 h-20 rounded-full bg-teal-100">
              <span className="text-4xl">🗑️</span>
            </div>
            <h4 className="font-bold mb-3">Permasalahan</h4>
            <p className="text-gray-600 text-sm">
              Banyak masyarakat masih bingung mengelola sampah dapur/organik.
              Kami mendesain teknologi informasi sebagai solusi pengelolaan.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white shadow rounded-xl border-t-4 border-teal-600 p-6 text-center">
            <div className="mx-auto mb-4 flex justify-center items-center text-teal-600 w-20 h-20 rounded-full bg-teal-100">
              <span className="text-4xl">💡</span>
            </div>
            <h4 className="font-bold mb-3">Peluang</h4>
            <p className="text-gray-600 text-sm">
              Peluang besar bagi penyedia layanan budidaya maggot untuk membantu
              masyarakat mengelola limbah dapur.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white shadow rounded-xl border-t-4 border-teal-600 p-6 text-center">
            <div className="mx-auto mb-4 flex justify-center items-center text-teal-600 w-20 h-20 rounded-full bg-teal-100">
              <span className="text-4xl">🎯</span>
            </div>
            <h4 className="font-bold mb-3">Keharusan</h4>
            <p className="text-gray-600 text-sm text-left">
              <strong>1. Edukasi:</strong> Ubah pola pikir dari "membuang" jadi
              "menyediakan bahan baku". <br />
              <strong>2. Standar:</strong> Panduan memilah sampah dapur. <br />
              <strong>3. Jaringan:</strong> Hubungkan rumah tangga & penyedia
              secara <i>real-time</i>.
            </p>
          </div>
        </div>

        <hr className="mb-12 border-gray-300" />

        {/* Visi & Misi */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 shadow rounded-xl bg-teal-50 border border-teal-200">
            <h4 className="font-bold text-teal-600 mb-3 text-center">
              🌍 Visi Kami
            </h4>
            <p className="text-gray-600 text-center leading-relaxed">
              Menjadi pionir platform pengelolaan sampah organik terintegrasi
              yang mewujudkan lingkungan bersih, sehat, dan mendukung ekonomi
              sirkular melalui maggot BSF.
            </p>
          </div>
          <div className="p-6 shadow rounded-xl bg-teal-50 border border-teal-200">
            <h4 className="font-bold text-teal-600 mb-3 text-center">
              🚀 Misi Kami
            </h4>
            <ul className="text-gray-600 leading-relaxed list-disc list-inside">
              <li>Edukasi berkelanjutan terkait pengolahan limbah.</li>
              <li>
                Membangun jaringan <i>real-time</i> masyarakat & penyedia.
              </li>
              <li>Efisiensi pendataan & penjemputan sampah terjadwal.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
