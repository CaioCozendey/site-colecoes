import type { ImageEntry, ItemImage } from "../../types";
import { MAX_IMAGES } from "../../services/images";

export default function ImageManager({
  entries,
  setEntries,
  setRemoved,
}: {
  entries: ImageEntry[];
  setEntries: (e: ImageEntry[]) => void;
  setRemoved: (fn: (prev: ItemImage[]) => ItemImage[]) => void;
}) {
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_IMAGES - entries.length;
    const added: ImageEntry[] = Array.from(files)
      .slice(0, room)
      .map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file) }));
    setEntries([...entries, ...added]);
  };

  const remove = (e: ImageEntry) => {
    if (e.image) setRemoved((prev) => [...prev, e.image!]);
    setEntries(entries.filter((x) => x.key !== e.key));
  };

  const makePrimary = (e: ImageEntry) =>
    setEntries([e, ...entries.filter((x) => x.key !== e.key)]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map((e, idx) => (
          <div key={e.key} className="relative group rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 aspect-square">
            <img src={e.preview} alt="" className="w-full h-full object-cover" />
            {idx === 0 && (
              <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Principal</span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/50">
              {idx !== 0 && (
                <button type="button" onClick={() => makePrimary(e)} className="flex-1 text-xs text-white py-1 hover:bg-white/20 rounded">
                  ⭐ Principal
                </button>
              )}
              <button type="button" onClick={() => remove(e)} className="flex-1 text-xs text-white py-1 hover:bg-red-600 rounded">
                🗑️ Remover
              </button>
            </div>
          </div>
        ))}

        {entries.length < MAX_IMAGES && (
          <label className="aspect-square flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500">
            <span className="text-3xl">＋</span>
            <span className="text-sm">Adicionar foto</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {entries.length} de {MAX_IMAGES} fotos • a primeira é a foto principal • JPG, PNG ou WebP
      </p>
    </div>
  );
}
