"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "px-4 py-3 border border-outline rounded-lg bg-surface text-on-surface placeholder:text-on-surface-variant/40 transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 w-full disabled:opacity-60 disabled:bg-surface-variant disabled:cursor-not-allowed";

export default function RegisterPage() {
  const router = useRouter();
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [isFormUnlocked, setIsFormUnlocked] = useState(false);

  // State untuk menyimpan data form yang akan dikirim ke backend
  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    email: "",
    password: "",
    no_hp: "",
    kampus: "",
    fakultas: "",
    program_studi: "",
    tahun_masuk: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  function normalizeName(str: string) {
    return str
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[.,]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toTitleCase(str: string) {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
  }

  // cek: apakah kata-kata yang diketik user adalah subset dari nama resmi
  function isNameMatch(inputNama: string, officialNama: string) {
    const inputTokens = normalizeName(inputNama).split(" ").filter(Boolean);
    const officialTokens = new Set(normalizeName(officialNama).split(" ").filter(Boolean));
    if (inputTokens.length === 0) return false;
    return inputTokens.every((t) => officialTokens.has(t));
  }

  const handleSync = async () => {
    if (!formData.nim || !formData.nama) {
      alert("Silakan isi Nama Lengkap dan NIM terlebih dahulu sebelum melakukan sync.");
      return;
    }

    setSyncState("syncing");

    try {
      // Hanya cari via NIM — ini identifier unik, tidak kena masalah "N-1 kata"
      const resNim = await fetch(`http://localhost:6969/api/pddikti/v2/mahasiswa/${formData.nim}`);
      const dataNim = await resNim.json();
      const listByNim = dataNim.data?.mahasiswa || [];

      // Validasi nama LOKAL (subset match), bukan lewat endpoint pencarian nama
      const matchedStudent = listByNim.find((mhs: any) =>
        isNameMatch(formData.nama, mhs.nama_mhs)
      );

      if (!matchedStudent) {
        alert("Data tidak ditemukan / nama tidak cocok dengan NIM. Silakan isi form secara manual.");
        setSyncState("error");
        setIsFormUnlocked(true);
        return;
      }

      const resDetail = await fetch(
        `http://localhost:6969/api/pddikti/v2/mahasiswa/detail/${matchedStudent.uniqueId}`
      );
      const dataDetail = await resDetail.json();

      if (dataDetail.success) {
        const mhsData = dataDetail.data.mahasiswaData;

        // Parse nama_prodi: "Sarjana | Pendidikan Bahasa Mandarin | Universitas Negeri Semarang"
        const prodiParts = mhsData.nama_prodi ? mhsData.nama_prodi.split(" | ") : [];
        const extractedProdi = prodiParts.length > 1 ? prodiParts[1] : (mhsData.nama_prodi || "");
        const extractedKampus = prodiParts.length > 2 ? prodiParts[2] : "";

        // Parse tanggal_masuk: "2023-08-21" -> "2023"
        const extractedTahun = mhsData.tanggal_masuk ? mhsData.tanggal_masuk.split("-")[0] : "";

        const formattedName = toTitleCase(matchedStudent.nama_mhs);

        const officialNim = matchedStudent.nim_mhs;

        setFormData((prev) => ({
          ...prev,
          nama: formattedName,
          nim: officialNim,
          kampus: extractedKampus,
          program_studi: extractedProdi,
          tahun_masuk: extractedTahun,
        }));

        setSyncState("synced");
      } else {
        setSyncState("error");
      }
    } catch (error) {
      console.error("Error saat melakukan sync data:", error);
      alert("Terjadi kesalahan jaringan/server saat sync data. Silakan isi secara manual.");
      setSyncState("error");
    } finally {
      // Apapun hasilnya (sukses/gagal), buka sisa input form agar bisa diisi/edit user
      setIsFormUnlocked(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:6969/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registrasi Berhasil!");
        router.push("/success")
      } else {
        alert(data.message || "Registrasi Gagal!");
      }
    } catch (error) {
      console.error("Error register:", error);
      alert("Terjadi kesalahan sistem saat mendaftar.");
    }
  };

  return (
    <div className="font-body-md text-on-surface min-h-screen flex flex-col">
      {/* TopAppBar */}
      <header className="bg-surface dark:bg-background border-b border-outline-variant dark:border-outline sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-gutter py-4 max-w-container-max mx-auto">
          <div className="text-headline-md font-bold text-primary dark:text-primary-fixed font-headline-lg">
            Internship Portal
          </div>
          <nav className="hidden md:flex gap-8">
            <Link
              href="/register"
              className="font-label-md text-label-md text-primary dark:text-primary-fixed border-b-2 border-primary transition-colors py-1"
            >
              Registration
            </Link>
            <Link
              href="/login"
              className="font-label-md text-label-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors py-1"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-stack-lg px-margin-mobile">
        <div className="max-w-[800px] mx-auto">
          {/* Registration Header Text */}
          <div className="text-center mb-stack-lg">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-2">
              Registrasi Mahasiswa Baru
            </h1>
            <p className="font-body-md text-secondary max-w-lg mx-auto">
              Silakan lengkapi formulir di bawah ini untuk mendaftarkan akun
              Anda ke dalam sistem.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-8 md:p-12 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-stack-md">
              {/* First Row: Nama & NIM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="nama"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Nama Lengkap <span className="text-primary">*</span>
                  </label>
                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    className={inputClass}
                    value={formData.nama}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="nim"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    NIM <span className="text-primary">*</span>
                  </label>
                  <input
                    id="nim"
                    name="nim"
                    type="text"
                    required
                    placeholder="Contoh: 123456789"
                    className={inputClass}
                    value={formData.nim}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Sync Data Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncState === "syncing"}
                  className={`flex items-center gap-2 px-6 py-2.5 border-2 font-label-md rounded-lg transition-all active:scale-95 disabled:cursor-not-allowed ${syncState === "synced"
                    ? "border-green-600 text-green-600 bg-green-500/5"
                    : syncState === "error"
                      ? "border-red-600 text-red-600 bg-red-500/5"
                      : "border-primary/30 text-primary hover:bg-primary/5"
                    }`}
                >
                  <span
                    className={`material-symbols-outlined ${syncState === "syncing" ? "animate-spin" : ""
                      }`}
                    style={{ fontSize: "20px" }}
                  >
                    {syncState === "synced"
                      ? "check_circle"
                      : syncState === "error"
                        ? "error"
                        : "sync"}
                  </span>
                  {syncState === "syncing"
                    ? "Syncing Data..."
                    : syncState === "synced"
                      ? "Data PDDIKTI Ditemukan"
                      : syncState === "error"
                        ? "Sync Gagal / Manual"
                        : "Sync Data PDDIKTI"}
                </button>
                <p className="text-sm text-secondary mt-2">
                  *Klik Sync Data untuk mengisi otomatis data Kampus, Prodi, dan Tahun Masuk.
                </p>
              </div>

              <div className="h-px bg-outline-variant my-stack-md" />

              {/* Subsequent Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {/* Email */}
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="email"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    disabled={!isFormUnlocked}
                    placeholder="nama@kampus.ac.id"
                    className={inputClass}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="password"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Kata Sandi <span className="text-primary">*</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    disabled={!isFormUnlocked}
                    placeholder="••••••••"
                    className={inputClass}
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="no_hp"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Nomor HP <span className="text-primary">*</span>
                  </label>
                  <input
                    id="no_hp"
                    name="no_hp"
                    type="tel"
                    required
                    disabled={!isFormUnlocked}
                    placeholder="0812xxxx"
                    className={inputClass}
                    value={formData.no_hp}
                    onChange={handleChange}
                  />
                </div>

                {/* Campus - Merubah dari select menjadi Text Input */}
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="kampus"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Kampus <span className="text-primary">*</span>
                  </label>
                  <input
                    id="kampus"
                    name="kampus"
                    type="text"
                    required
                    disabled={!isFormUnlocked}
                    placeholder="Contoh: Universitas Indonesia"
                    className={inputClass}
                    value={formData.kampus}
                    onChange={handleChange}
                  />
                </div>

                {/* Faculty */}
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="fakultas"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Fakultas <span className="text-primary">*</span>
                  </label>
                  <input
                    id="fakultas"
                    name="fakultas"
                    type="text"
                    required
                    disabled={!isFormUnlocked}
                    placeholder="Contoh: Fakultas Teknik"
                    className={inputClass}
                    value={formData.fakultas}
                    onChange={handleChange}
                  />
                </div>

                {/* Major */}
                <div className="flex flex-col gap-stack-sm group">
                  <label
                    htmlFor="program_studi"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Program Studi <span className="text-primary">*</span>
                  </label>
                  <input
                    id="program_studi"
                    name="program_studi"
                    type="text"
                    required
                    disabled={!isFormUnlocked}
                    placeholder="Contoh: Informatika"
                    className={inputClass}
                    value={formData.program_studi}
                    onChange={handleChange}
                  />
                </div>

                {/* Entrance Year */}
                <div className="flex flex-col gap-stack-sm md:col-span-2 group">
                  <label
                    htmlFor="tahun_masuk"
                    className="font-label-md text-label-md text-on-surface group-focus-within:text-primary transition-colors"
                  >
                    Tahun Masuk <span className="text-primary">*</span>
                  </label>
                  <input
                    id="tahun_masuk"
                    name="tahun_masuk"
                    type="number"
                    min={2000}
                    max={2030}
                    required
                    disabled={!isFormUnlocked}
                    placeholder="2024"
                    className={inputClass}
                    value={formData.tahun_masuk}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Primary Submit Button */}
              <div className="pt-8">
                <button
                  type="submit"
                  disabled={!isFormUnlocked}
                  className="w-full bg-primary text-on-primary font-bold py-4 rounded-lg hover:bg-primary/95 transition-all active:scale-[0.98] shadow-md flex justify-center items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Daftar Akun Sekarang</span>
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </button>
              </div>

              <p className="text-center font-label-sm text-secondary mt-4">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="text-primary font-bold hover:underline"
                >
                  Masuk di sini
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Footer (Dibiarkan tetap sama) */}
      <footer className="bg-surface-dim dark:bg-surface-dim border-t border-outline-variant dark:border-outline mt-stack-lg">
        <div className="w-full py-stack-md px-margin-mobile md:px-gutter flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <span className="font-label-md font-bold text-primary">
              Internship Portal
            </span>
            <p className="font-label-sm text-secondary dark:text-secondary-fixed">
              © {new Date().getFullYear()} Rznive. All rights reserved.
            </p>
          </div>
          <div className="flex gap-6">
            <a
              href="#"
              className="font-label-sm text-secondary dark:text-secondary-fixed hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="font-label-sm text-secondary dark:text-secondary-fixed hover:text-primary transition-colors"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}