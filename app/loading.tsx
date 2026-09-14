export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-lumi-purple" />
        <p className="mt-4 text-sm text-white/60">Loading Lumi...</p>
      </div>
    </div>
  );
}
