export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 leading-tight">
              Ubah Sampah Organik Menjadi{" "}
              <span className="text-teal-600">Berkah</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Waste & Wishes membantu mengelola limbah organik dari rumah tangga
              dan UMKM di wilayah Gejayan secara bertanggung jawab melalui
              budidaya maggot BSF demi mewujudkan bumi yang lebih sehat dan
              lestari.
            </p>
            <div className="flex gap-4">
              <a
                href="/langganan"
                className="bg-teal-600 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-teal-700 transition"
              >
                Mulai Berlangganan
              </a>
              <a
                href="#layanan"
                className="border border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition"
              >
                Pelajari Layanan
              </a>
            </div>
          </div>

          {/* Right */}
          <div className="text-center md:text-left">
            <div className="p-8 rounded-xl shadow bg-white border-t-4 border-teal-500">
              <div className="mb-4">
                <span className="text-5xl">🌱</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-3">
                Teknologi untuk Kesehatan Bumi
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Setiap sampah organik yang Anda setorkan akan langsung diolah
                oleh maggot BSF, memangkas rantai penumpukan limbah sekaligus
                menghasilkan pakan ternak bernilai tinggi.
              </p>
              <div className="bg-teal-600 text-white px-4 py-2 rounded-full font-semibold inline-block">
                📍 Cakupan Wilayah: Wedomartani & Sekitarnya
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Layanan Section */}
      <section id="layanan" className="bg-gray-50 py-16">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Layanan Utama Kami
            </h2>
            <p className="text-gray-600 text-lg">
              Solusi terintegrasi dari Waste & Wishes untuk kelestarian lingkungan Gejayan
            </p>
            <div className="mx-auto bg-teal-600 h-1 w-20 rounded mt-4"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 justify-center">
            {/* Card Langganan */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-600 mb-6">
                🚛
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Langganan Pengambilan Sampah
              </h3>
              <p className="text-gray-600 flex-grow">
                Pilahlah sampah organik Anda dari rumah atau tempat usaha UMKM,
                dan biarkan tim kami menjemputnya secara terjadwal langsung di depan pintu rumah Anda.
              </p>
              <a
                href="/langganan"
                className="mt-6 bg-teal-600 text-white font-semibold py-3 rounded-lg shadow hover:bg-teal-700 transition text-center"
              >
                Mulai Berlangganan
              </a>
            </div>

            {/* Card Event */}
            <div className="bg-white rounded-xl shadow p-8 flex flex-col">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
                📅
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Edukasi & Event Lingkungan
              </h3>
              <p className="text-gray-600 flex-grow">
                Ikuti berbagai program pelatihan gratis, sosialisasi budidaya maggot BSF, dan gerakan
                kerelawanan aksi hijau demi meningkatkan kesadaran ekologis bersama komunitas.
              </p>
              <a
                href="/event"
                className="mt-6 border border-gray-400 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-100 transition text-center"
              >
                Lihat Jadwal Event
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik Section */}
      <section className="container mx-auto py-16">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div>
            <h2 className="text-4xl font-extrabold text-teal-600 mb-2">10+ Ton</h2>
            <p className="text-gray-600 font-semibold">Limbah Organik Terolah</p>
          </div>
          <div className="border-x">
            <h2 className="text-4xl font-extrabold text-teal-600 mb-2">250+</h2>
            <p className="text-gray-600 font-semibold">Mitra Rumah Tangga & UMKM</p>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-teal-600 mb-2">15+</h2>
            <p className="text-gray-600 font-semibold">Event Edukasi Terlaksana</p>
          </div>
        </div>
      </section>
    </>
  );
}
