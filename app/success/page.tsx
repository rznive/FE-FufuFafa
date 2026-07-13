import Link from 'next/link';

export default function SuccessPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">

                {/* Ikon Centang Hijau */}
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full">
                    <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>

                {/* Teks Pesan */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Proses Berhasil!
                </h1>
                <p className="text-gray-600 mb-8">
                    Halaman dummy ini menandakan bahwa routing atau aksi yang sedang Anda uji coba telah berjalan dengan lancar.
                </p>

                {/* Tombol Kembali */}
                <Link
                    href="/"
                    className="inline-flex justify-center items-center w-full px-6 py-3 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    Kembali ke Beranda
                </Link>

            </div>
        </div>
    );
}