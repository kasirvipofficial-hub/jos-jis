"use client";
import React, { useState } from "react";
import { Upload, BookOpen, User, FileText, Loader2, Info } from "lucide-react";

interface ImporterDialogProps {
  onImportSuccess: (kitabId: string) => void;
}

export default function ImporterDialog({ onImportSuccess }: ImporterDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !textContent) {
      setError("Judul kitab dan isi teks wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, description, textContent }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengimpor kitab.");
      }
      onImportSuccess(data.id);
      setOpen(false);
      setTitle("");
      setAuthor("");
      setDescription("");
      setTextContent("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const handleSampleLoad = () => {
    setTitle("Riyadhus Shalihin");
    setAuthor("Imam An-Nawawi");
    setDescription("Kitab kumpulan hadits populer mengenai etika, adab, dan moralitas Islam.");
    setTextContent(`JILID 1: JILID KESATU
BAB 1: BAB IKHLAS DAN MENETAPKAN NIAT
SUBBAB 1: Keutamaan Niat Baik
إنَّمَا الأَعْمَالُ بِالنِّيَّاتِ وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى
Sesungguhnya setiap amal perbuatan tergantung pada niatnya, dan setiap orang akan mendapatkan sesuai apa yang ia niatkan.
[FOOTNOTE] Hadits ini diriwayatkan oleh Bukhari dan Muslim, merupakan pilar utama ajaran Islam.
[SYARAH] Al-Hafiz Ibnu Hajar berkata bahwa niat adalah ruh suatu ibadah.

SUBBAB 2: Ikhlas Karena Allah
مَنْ عَمِلَ عَمَلًا أَشْرَكَ فِيهِ مَعِي غَيْرِي تَرَكْتُهُ وَشِرْكَهُ
Barangsiapa mengerjakan suatu amal dengan menyekutukan selain Aku, maka Aku tinggalkan dia bersama keserikatannya.
[FOOTNOTE] Diriwayatkan oleh Muslim, hadits Qudsi tentang bahaya syirik khafi (riya').
[SYARAH] Melakukan amal karena pujian manusia akan membatalkan pahala amal tersebut.`);
  };

  return (
    <div id="importer-dialog-container">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#b89528] text-[#0f172a] font-medium px-4 py-2 rounded-lg shadow-lg border border-[#d4af37]/50 transition-all duration-300 transform hover:scale-[1.02]"
      >
        <Upload className="w-4 h-4" />
        <span>Impor Kitab Baru (.txt)</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-[#0f172a] border border-[#d4af37]/30 rounded-xl shadow-2xl p-6 relative overflow-hidden transition-all duration-300 scale-100 max-h-[90vh] flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#d4af37] via-emerald-500 to-[#d4af37]" />
            <div className="flex justify-between items-center pb-4 border-b border-[#334155]">
              <h3 className="text-xl font-bold text-[#f8fafc] font-sans flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#d4af37]" />
                <span>Unggah & Impor Kitab</span>
              </h3>
              <button onClick={() => setOpen(false)} className="text-[#94a3b8] hover:text-[#f8fafc] font-bold text-lg">✕</button>
            </div>
            <form onSubmit={handleImport} className="space-y-4 pt-4 overflow-y-auto flex-1 pr-2">
              {error && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-200 text-sm rounded-lg flex items-center gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-[#d4af37]" /> Judul Kitab <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Riyadhus Shalihin"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#1e293b]/70 border border-[#334155] focus:border-[#d4af37]/70 text-[#f8fafc] rounded-lg p-2.5 outline-none transition-all placeholder:text-[#475569]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3 text-[#d4af37]" /> Nama Pengarang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Imam An-Nawawi"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#1e293b]/70 border border-[#334155] focus:border-[#d4af37]/70 text-[#f8fafc] rounded-lg p-2.5 outline-none transition-all placeholder:text-[#475569]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-[#d4af37]" /> Deskripsi Kitab
                </label>
                <input
                  type="text"
                  placeholder="Deskripsi singkat mengenai isi kitab atau bab kajian."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-[#334155] focus:border-[#d4af37]/70 text-[#f8fafc] rounded-lg p-2.5 outline-none transition-all placeholder:text-[#475569]"
                />
              </div>
              <div className="space-y-2 flex-1 flex flex-col min-h-[250px]">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-[#d4af37]" /> Isi Teks Kitab (.txt) <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSampleLoad}
                    className="text-xs text-[#d4af37]/80 hover:text-[#d4af37] flex items-center gap-1 border border-[#d4af37]/30 hover:border-[#d4af37]/60 px-2 py-0.5 rounded transition-all"
                  >
                    Simulasi Kitab Sampel
                  </button>
                </div>
                <textarea
                  required
                  placeholder="Gunakan pemisah baris untuk mendeteksi struktur..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="w-full flex-1 bg-[#1e293b]/50 border border-[#334155] focus:border-[#d4af37]/70 text-[#f8fafc] rounded-lg p-3 outline-none font-mono text-xs placeholder:text-[#475569] resize-none h-[250px]"
                />
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-[#334155]">
                <span className="text-xs text-[#64748b]">Mendukung pemisah otomatis paragraf, syarah, tafsir, dan catatan kaki.</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border border-[#334155] text-[#94a3b8] hover:text-[#f8fafc] rounded-lg transition-all text-sm">Batalkan</button>
                  <button type="submit" disabled={loading} className="flex items-center gap-1 bg-[#d4af37] text-[#0f172a] hover:bg-[#b89528] font-bold px-5 py-2 rounded-lg transition-all text-sm shadow-md disabled:opacity-50">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengimpor...</span>
                      </>
                    ) : (
                      <span>Impor Kitab</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}