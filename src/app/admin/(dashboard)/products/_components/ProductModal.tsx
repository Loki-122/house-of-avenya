'use client';

/**
 * Add / Edit product modal — premium editorial redesign.
 *
 * A single form handles both creation and editing. The
 * form is organized into clear sections for easy navigation.
 * Submits as a single FormData payload to a server action.
 *
 * Images are uploaded directly to Supabase Storage by the
 * signed-in admin. The modal keeps a queue of pending
 * uploads; the parent page commits them once the product
 * record exists.
 */
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { AdminIcon } from '@/components/admin/AdminIcon';
import { supabase } from '@/lib/supabase';
import type { AdminProduct, AdminCategory, ProductVariantInput, ProductDetailInput, ProductCareInput, ProductImageInput } from '@/lib/admin-products';

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const EMPTY_VARIANT: ProductVariantInput = { size: '', color: '', stock: 0, sku: '' };

/** Maximum size per uploaded image, in bytes (5 MB). */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Maximum number of images that can be queued at once. */
const MAX_IMAGE_QUEUE = 10;
/** Accepted image MIME types for the admin uploader. */
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
/** Supabase Storage bucket used for product images. */
const PRODUCT_IMAGES_BUCKET = 'product-images';

/** A file the admin has selected but not yet uploaded. */
type PendingUpload = {
  id: string;
  file: File;
  /** Local object URL used for the thumbnail preview. */
  previewUrl: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  /** Public URL after a successful upload, or undefined until then. */
  uploadedUrl?: string;
  errorMessage?: string;
};

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `u-${Math.random().toString(36).slice(2, 10)}`;
}

function fileExtension(file: File): string {
  const match = /\.(?:([a-zA-Z0-9]+))?(?:\?|$)/.exec(file.name);
  return match?.[1]?.toLowerCase() ?? '';
}

function validateImage(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `Unsupported type “${file.type || file.name}”. Use JPG, PNG or WEBP.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `“${file.name}” is too large — maximum 5 MB per image.`;
  }
  return null;
}

function queueToFormImage(p: PendingUpload): ProductImageInput {
  return { src: p.uploadedUrl ?? p.previewUrl, alt: '' };
}

function formImageToQueue(img: ProductImageInput, index: number): PendingUpload | null {
  if (!img?.src) return null;
  return {
    id: `existing-${index}`,
    file: new File([img.src], `existing-${index}`),
    previewUrl: img.src,
    status: 'done',
    uploadedUrl: img.src,
  };
}

/**
 * Supabase Storage errors sometimes arrive as a plain object
 * (e.g. `{ message: 'Bucket not found' }`) and sometimes as a
 * non-Error thrown value. Normalise both into a human-readable
 * string so the UI never shows a raw "Unexpected end of JSON input".
 */
function formatStorageError(err: unknown, fileName: string): string {
  if (err instanceof Error) {
    const msg = err.message.trim();
    if (msg) return `${fileName}: ${msg}`;
  }
  if (err && typeof err === 'object') {
    const o = err as { message?: unknown; error?: unknown; statusCode?: unknown };
    const parts: string[] = [];
    if (typeof o.message === 'string' && o.message.trim()) parts.push(o.message.trim());
    if (typeof o.error === 'string' && o.error.trim()) parts.push(o.error.trim());
    if (typeof o.statusCode === 'string' && o.statusCode.trim()) parts.push(o.statusCode.trim());
    if (parts.length > 0) return `${fileName}: ${parts.join(' — ')}`;
  }
  if (typeof err === 'string' && err.trim()) return `${fileName}: ${err.trim()}`;
  return `${fileName}: Upload failed. Check the Supabase Storage bucket name and RLS policies.`;
}

type FormState = {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  price: string;
  compare_at_price: string;
  material: string;
  is_featured: boolean;
  is_new: boolean;
  is_active: boolean;
  sizes: { name: string }[];
  colors: { name: string; hex: string }[];
  variants: ProductVariantInput[];
  details: ProductDetailInput[];
  care: ProductCareInput[];
  images: ProductImageInput[];
};

function emptyForm(): FormState {
  return {
    name: '',
    slug: '',
    category_id: '',
    description: '',
    price: '',
    compare_at_price: '',
    material: '',
    is_featured: false,
    is_new: false,
    is_active: true,
    sizes: DEFAULT_SIZES.map((n) => ({ name: n })),
    colors: [],
    variants: [],
    details: [],
    care: [],
    images: [],
  };
}

function productToForm(p: AdminProduct): FormState {
  const sizes = p.sizes.map((s) => ({ name: s.name }));
  const colors = p.colors.map((c) => ({ name: c.name, hex: c.hex }));

  const sizeSet = new Set(sizes.map((s) => s.name));
  const colorSet = new Set(colors.map((c) => c.name));

  const variants: ProductVariantInput[] = p.variants.map((v) => ({
    size: sizeSet.has(v.size_id ?? '') ? (v.size_id ?? '') : '',
    color: colorSet.has(v.color_id ?? '') ? (v.color_id ?? '') : '',
    stock: v.stock,
    sku: v.sku ?? '',
  }));

  return {
    name: p.name,
    slug: p.slug,
    category_id: p.category_id ?? '',
    description: p.description,
    price: String(p.price),
    compare_at_price: p.compare_at_price ? String(p.compare_at_price) : '',
    material: p.material ?? '',
    is_featured: p.is_featured,
    is_new: p.is_new,
    is_active: p.is_active,
    sizes,
    colors,
    variants,
    details: p.details.map((d) => ({ label: d.label, value: d.value })),
    care: p.care.map((c) => ({ instruction: c.instruction })),
    images: p.images.map((img) => ({ src: img.src, alt: img.alt })),
  };
}

export default function ProductModal({
  product,
  categories,
  saving,
  error,
  successMessage,
  onSave,
  onClose,
}: {
  product: AdminProduct | null;
  categories: AdminCategory[];
  saving: boolean;
  error: string | null;
  successMessage: string | null;
  onSave: (form: FormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    product ? productToForm(product) : emptyForm(),
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [reducedMotion, setReducedMotion] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Stable per-modal folder inside the storage bucket. For a new
  // product the real ID does not exist yet, so we upload under a
  // client-side folder and hand the public URLs to the parent's
  // save flow, which persists them as product_images rows.
  const pendingFolderRef = useRef<string>(`pending-${makeId()}`);

  // Pending image uploads (selected but not yet committed to the DB).
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    setReducedMotion(
      typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false,
    );
  }, []);

  useEffect(() => {
    if (product) {
      setForm(productToForm(product));
      // Existing images become "done" previews so the editor
      // shows them without re-uploading.
      setPendingUploads(
        (product.images ?? []).map((img, i) => formImageToQueue(img, i)).filter(
          (p): p is PendingUpload => p !== null,
        ),
      );
    } else {
      setForm(emptyForm());
      setPendingUploads([]);
    }
    setValidationMessage(null);
    setServerError(null);
    setUploadError(null);
  }, [product]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  function fieldClassName(field: string, base: string) {
    const hasError = touched[field] && !form[field as keyof FormState];
    return [base, hasError ? 'border-brand-burgundy/60' : '']
      .filter(Boolean)
      .join(' ');
  }

  function validate(): string[] {
    const invalid: string[] = [];

    if (!form.name.trim()) invalid.push('name');
    if (!form.slug.trim()) invalid.push('slug');
    if (!form.category_id) invalid.push('category_id');
    if (!form.description.trim()) invalid.push('description');
    if (!form.price || parseFloat(form.price) <= 0) invalid.push('price');
    if (form.colors.length === 0) invalid.push('colors');
    if (totalImageCount() === 0) invalid.push('images');

    const next: Record<string, boolean> = {};
    for (const field of invalid) next[field] = true;
    setTouched(next);
    return invalid;
  }

  function totalImageCount(): number {
    return form.images.length + pendingUploads.length;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setServerError(null);

    const invalid = validate();
    if (invalid.length > 0) {
      const labels: Record<string, string> = {
        name: 'Product name',
        slug: 'Slug',
        category_id: 'Category',
        description: 'Description',
        price: 'Price',
        colors: 'Colours',
        images: 'Images',
      };
      const first = invalid[0];
      setValidationMessage(
        `${labels[first] ?? first} is required. We've moved you to that section.`,
      );
      // Move to the first tab containing an invalid field and focus it.
      const section = fieldToSection(first);
      if (section) setActiveSection(section);
      // Let React re-render before focusing.
      requestAnimationFrame(() => {
        const el = document.getElementById(first) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el) {
          el.focus({ preventScroll: false });
          if (typeof el.select === 'function') el.select();
        }
      });
      return;
    }
    setValidationMessage(null);

    // Commit any queued uploads to Supabase Storage before handing
    // the product record to the parent save flow.
    await uploadPendingImages();
    const failed = pendingUploads.filter((p) => p.status === 'error');
    if (failed.length > 0) {
      setServerError(
        `${failed.length} image${failed.length === 1 ? '' : 's'} failed to upload.`,
      );
      return;
    }

    const data = new FormData();
    data.set('name', form.name.trim());
    data.set('slug', form.slug.trim());
    data.set('category_id', form.category_id);
    data.set('description', form.description.trim());
    data.set('price', form.price);
    if (form.compare_at_price) data.set('compare_at_price', form.compare_at_price);
    if (form.material.trim()) data.set('material', form.material.trim());
    data.set('is_featured', form.is_featured ? 'on' : 'off');
    data.set('is_new', form.is_new ? 'on' : 'off');
    data.set('is_active', form.is_active ? 'on' : 'off');
    data.set('sizes', JSON.stringify(form.sizes));
    data.set('colors', JSON.stringify(form.colors));
    data.set('variants', JSON.stringify(form.variants));
    data.set('details', JSON.stringify(form.details));
    data.set('care', JSON.stringify(form.care));
    data.set('images', JSON.stringify(form.images));

    try {
      await onSave(data);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save product');
    }
  }

  function generateSlug() {
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    update('slug', slug);
  }

  function fieldToSection(field: string): string | null {
    switch (field) {
      case 'name':
      case 'slug':
      case 'category_id':
      case 'description':
        return 'basic';
      case 'price':
        return 'pricing';
      case 'colors':
        return 'colors';
      case 'images':
        return 'images';
      default:
        return null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Image drag & drop + Supabase Storage uploads                       */
  /* ------------------------------------------------------------------ */

  function addFiles(fileList: FileList | null): void {
    if (!fileList) return;
    const files = Array.from(fileList);
    const existingCount = totalImageCount();
    const remaining = MAX_IMAGE_QUEUE - existingCount;
    if (remaining <= 0) {
      setUploadError(`Maximum ${MAX_IMAGE_QUEUE} images per product.`);
      return;
    }
    const accepted: PendingUpload[] = [];
    let overflow = 0;
    for (const file of files.slice(0, remaining)) {
      const err = validateImage(file);
      if (err) {
        setUploadError(err);
        continue;
      }
      accepted.push({
        id: makeId(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
      });
    }
    overflow = files.length - remaining;
    if (overflow > 0) {
      setUploadError(
        `Only the first ${remaining} of ${files.length} files were added — the limit is ${MAX_IMAGE_QUEUE} images.`,
      );
    }
    if (accepted.length === 0) return;
    setUploadError(null);
    setPendingUploads((prev) => [...prev, ...accepted]);
    // Commit previews to the form payload so the rest of the
    // modal (and the parent's save flow) can see them.
    setForm((f) => ({
      ...f,
      images: [...f.images, ...accepted.map(queueToFormImage)],
    }));
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>): void {
    addFiles(event.target.files);
    // Reset so the same file can be re-selected after a removal.
    event.target.value = '';
  }

  function onDragEnter(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (!event.dataTransfer.types.includes('Files')) return;
    setDragOver(true);
  }

  function onDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (!event.dataTransfer.types.includes('Files')) return;
    event.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }

  function onDragLeave(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    // Only clear when leaving the drop zone entirely.
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragOver(false);
  }

  function onDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setDragOver(false);
    addFiles(event.dataTransfer.files);
  }

  function removeImage(index: number): void {
    setPendingUploads((prev) => {
      const next = prev.filter((_, i) => i !== index);
      next.forEach((p) => {
        if (p.status === 'pending') URL.revokeObjectURL(p.previewUrl);
      });
      return next;
    });
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  }

  function moveImage(from: number, to: number): void {
    if (from < 0 || to < 0) return;
    const clamp = (n: number, max: number) => Math.max(0, Math.min(n, max));
    const nextFrom = clamp(from, totalImageCount() - 1);
    const nextTo = clamp(to, totalImageCount() - 1);
    if (nextFrom === nextTo) return;

    setPendingUploads((prev) => {
      const next = [...prev];
      const [moved] = next.splice(nextFrom, 1);
      next.splice(nextTo, 0, moved);
      return next;
    });
    setForm((f) => {
      const next = [...f.images];
      const [moved] = next.splice(nextFrom, 1);
      next.splice(nextTo, 0, moved);
      return { ...f, images: next };
    });
  }

  async function uploadPendingImages(): Promise<PendingUpload[]> {
    const pending = pendingUploads.filter((p) => p.status === 'pending');
    if (pending.length === 0) return pendingUploads;

    setPendingUploads((prev) =>
      prev.map((p) =>
        p.status === 'pending' ? { ...p, status: 'uploading' } : p,
      ),
    );

    const folder = pendingFolderRef.current;
    const updated: PendingUpload[] = [];
    for (const p of pending) {
      const ext = fileExtension(p.file) || 'jpg';
      const storagePath = `${PRODUCT_IMAGES_BUCKET}/${folder}/${p.id}.${ext}`;
      try {
        const { error } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(storagePath, p.file, {
            contentType: p.file.type || 'image/jpeg',
            upsert: true,
          });
        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .getPublicUrl(storagePath);
        const publicUrl = urlData?.publicUrl;
        if (!publicUrl) throw new Error('Could not retrieve a public URL.');

        updated.push({ ...p, status: 'done', uploadedUrl: publicUrl });
      } catch (err) {
        updated.push({
          ...p,
          status: 'error',
          errorMessage: formatStorageError(err, p.file.name),
        });
      }
    }

    setPendingUploads((prev) =>
      prev.map((p) => {
        const found = updated.find((u) => u.id === p.id);
        return found ?? p;
      }),
    );
    // Reflect committed URLs in the form payload so the parent
    // save flow persists the correct product_images rows.
    setForm((f) => ({
      ...f,
      images: [
        ...f.images.map((img) => {
          const match = updated.find(
            (u) => u.uploadedUrl === img.src && u.status === 'done',
          );
          return match ? queueToFormImage(match) : img;
        }),
      ],
    }));
    return updated;
  }

  function formImageToQueue(img: ProductImageInput, index: number): PendingUpload | null {
    if (!img?.src) return null;
    return {
      id: `existing-${index}`,
      file: new File([img.src], `existing-${index}`),
      previewUrl: img.src,
      status: 'done',
      uploadedUrl: img.src,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Thumbnail component — rendered inside the images section.          */
  /* ------------------------------------------------------------------ */
  function ImageThumbnail({
    upload,
    index,
    isPrimary,
    onRemove,
    onMove,
  }: {
    upload: PendingUpload;
    index: number;
    isPrimary: boolean;
    onRemove: (index: number) => void;
    onMove: (from: number, to: number) => void;
  }) {
    const [dragging, setDragging] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    function onThumbDragStart(e: DragEvent<HTMLButtonElement>): void {
      setDragging(true);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    }

    function onThumbDragEnd(): void {
      setDragging(false);
      setDragOverIndex(null);
    }

    function onThumbDragOver(e: DragEvent<HTMLButtonElement>): void {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    }

    function onThumbDragLeave(): void {
      setDragOverIndex(null);
    }

    function onThumbDrop(e: DragEvent<HTMLButtonElement>): void {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData('text/plain'));
      if (!Number.isNaN(from)) onMove(from, index);
      setDragOverIndex(null);
    }

    return (
      <div
        className={`group relative rounded-xl border p-2 transition-all duration-200 ${
          dragOverIndex === index
            ? 'border-brand-antiqueGold bg-brand-antiqueGold/10'
            : 'border-brand-antiqueGold/20 bg-white'
        } ${dragging ? 'opacity-40' : ''}`}
      >
        <button
          type="button"
          draggable
          onDragStart={onThumbDragStart}
          onDragEnd={onThumbDragEnd}
          onDragOver={onThumbDragOver}
          onDragLeave={onThumbDragLeave}
          onDrop={onThumbDrop}
          className="relative block w-full cursor-grab active:cursor-grabbing"
          aria-label={`Reorder image ${index + 1}`}
        >
          <div className="relative aspect-square overflow-hidden rounded-lg border border-brand-antiqueGold/15 bg-brand-cream">
            {upload.status === 'error' ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-brand-burgundy/5 px-2 text-center">
                <AdminIcon name="xCircle" size={18} className="text-brand-burgundy" />
                <span className="text-[0.55rem] uppercase tracking-wider text-brand-burgundy">
                  Failed
                </span>
              </div>
            ) : (
              <img
                src={upload.previewUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                style={{ animation: reducedMotion ? 'none' : undefined }}
              />
            )}
            {upload.status === 'uploading' && (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-espresso/40">
                <span
                  className={`h-5 w-5 rounded-full border-2 border-brand-ivory/30 border-t-brand-ivory ${
                    reducedMotion ? '' : 'animate-spin'
                  }`}
                />
              </div>
            )}
            {isPrimary && upload.status !== 'error' && (
              <span className="absolute left-1.5 top-1.5 rounded bg-brand-espresso/80 px-1.5 py-0.5 text-[0.55rem] font-medium uppercase tracking-wider text-brand-ivory">
                Primary
              </span>
            )}
          </div>
          <span className="mt-1.5 block text-center text-[0.55rem] uppercase tracking-wider text-brand-espresso/40">
            Drag to reorder
          </span>
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-brand-espresso/60 shadow-sm transition-colors hover:bg-brand-burgundy/5 hover:text-brand-burgundy"
          aria-label={`Remove image ${index + 1}`}
        >
          <AdminIcon name="close" size={12} />
        </button>
        {upload.errorMessage && (
          <p
            title={upload.errorMessage}
            className="mt-1 line-clamp-2 text-[0.55rem] text-brand-burgundy"
          >
            {upload.errorMessage}
          </p>
        )}
      </div>
    );
  }

  const sections = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'images', label: 'Images' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'flags', label: 'Flags' },
    { id: 'sizes', label: 'Sizes' },
    { id: 'colors', label: 'Colours' },
    { id: 'details', label: 'Details' },
    { id: 'inventory', label: 'Inventory' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-brand-espresso/70 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-brand-antiqueGold/25 bg-white shadow-2xl">
        {/* Header */}
        <div className="shrink-0 border-b border-brand-antiqueGold/15 bg-white px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-sans text-[0.625rem] uppercase tracking-[0.5em] text-brand-antiqueGoldDark">
                {product ? 'Edit' : 'Add new'}
              </p>
              <h2
                ref={titleRef}
                tabIndex={-1}
                className="mt-1.5 font-display text-2xl font-light uppercase tracking-[0.04em] text-brand-espresso"
              >
                {product ? product.name : 'New Product'}
              </h2>
              {product && (
                <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-wider text-brand-espresso/40">
                  {product.slug}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-brand-espresso/50 transition-colors hover:bg-brand-cream hover:text-brand-espresso"
            >
              <AdminIcon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {(serverError || error) && (
          <div
            role="alert"
            className="mx-6 mt-5 flex items-start gap-3 rounded-lg border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-4 py-3 sm:mx-8"
          >
            <AdminIcon
              name="xCircle"
              size={17}
              className="mt-0.5 shrink-0 text-brand-burgundy"
            />
            <p className="text-sm text-brand-burgundy">
              {serverError || error}
            </p>
          </div>
        )}

        {/* Validation banner */}
        {validationMessage && (
          <div
            role="alert"
            className="mx-6 mt-5 flex items-start gap-3 rounded-lg border border-amber-600/25 bg-amber-500/10 px-4 py-3 sm:mx-8"
          >
            <AdminIcon
              name="alertTriangle"
              size={17}
              className="mt-0.5 shrink-0 text-amber-700"
            />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Please complete the highlighted fields.
              </p>
              <p className="mt-0.5 text-xs text-amber-700/80">
                {validationMessage}
              </p>
            </div>
          </div>
        )}

        {/* Success banner */}
        {successMessage && (
          <div
            role="status"
            className="mx-6 mt-5 flex items-start gap-3 rounded-lg border border-emerald-700/25 bg-emerald-700/[0.06] px-4 py-3 sm:mx-8"
          >
            <AdminIcon
              name="checkCircle"
              size={17}
              className="mt-0.5 shrink-0 text-emerald-700"
            />
            <p className="text-sm text-emerald-800">{successMessage}</p>
          </div>
        )}

        {/* Section navigation */}
        <div className="shrink-0 border-b border-brand-antiqueGold/10 bg-brand-cream/30 px-6 sm:px-8">
          <div className="scrollbar-thin flex gap-1 overflow-x-auto py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.2em] transition-colors duration-300 ${
                  activeSection === section.id
                    ? 'bg-white text-brand-espresso shadow-sm'
                    : 'text-brand-espresso/50 hover:text-brand-espresso/70'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 sm:px-8">
            {/* Section 1: Basic Information */}
            {activeSection === 'basic' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-xs font-medium text-brand-espresso/70"
                    >
                      Product name <span className="text-brand-burgundy">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      onBlur={() => markTouched('name')}
                      className={fieldClassName('name', 'w-full rounded-lg border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25')}
                      placeholder="e.g. Aarvi Silk Saree"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="slug"
                      className="mb-2 block text-xs font-medium text-brand-espresso/70"
                    >
                      Slug <span className="text-brand-burgundy">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="slug"
                        type="text"
                        required
                        value={form.slug}
                        onChange={(e) => update('slug', e.target.value)}
                        onBlur={() => markTouched('slug')}
                        className={fieldClassName('slug', 'flex-1 rounded-lg border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25')}
                        placeholder="aarvi-silk-saree"
                      />
                      <button
                        type="button"
                        onClick={generateSlug}
                        className="rounded-lg border border-brand-antiqueGold/30 px-4 py-2.5 text-xs font-medium text-brand-antiqueGoldDark transition-colors hover:bg-brand-cream"
                      >
                        Auto
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="category_id"
                      className="mb-2 block text-xs font-medium text-brand-espresso/70"
                    >
                      Category <span className="text-brand-burgundy">*</span>
                    </label>
                    <select
                      id="category_id"
                      required
                      value={form.category_id}
                      onChange={(e) => update('category_id', e.target.value)}
                      onBlur={() => markTouched('category_id')}
                      className={fieldClassName('category_id', 'w-full rounded-lg border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25')}
                    >
                      <option value="">Select category…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="material"
                      className="mb-2 block text-xs font-medium text-brand-espresso/70"
                    >
                      Material
                    </label>
                    <input
                      id="material"
                      type="text"
                      value={form.material}
                      onChange={(e) => update('material', e.target.value)}
                      className="w-full rounded-lg border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                      placeholder="e.g. 100% Mulberry Kanchipuram silk"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-xs font-medium text-brand-espresso/70"
                  >
                    Description{' '}
                    <span className="text-brand-burgundy">*</span>
                  </label>
                  <textarea
                    id="description"
                    required
                    rows={5}
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    onBlur={() => markTouched('description')}
                    className={fieldClassName('description', 'w-full rounded-lg border border-brand-espresso/15 bg-white px-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25')}
                    placeholder="Describe the piece in the House of Avenya editorial voice…"
                  />
                </div>
              </div>
            )}

            {/* Section 2: Images — drag & drop uploader */}
            {activeSection === 'images' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  id="product-image-input"
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  multiple
                  className="hidden"
                  onChange={onFileInput}
                />

                {/* Drop zone */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload product images"
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ${
                    dragOver
                      ? 'scale-[1.005] border-brand-antiqueGold bg-brand-antiqueGold/10 shadow-[0_0_0_4px_rgba(201,168,107,0.12)]'
                      : 'border-brand-antiqueGold/30 bg-brand-cream/30 hover:border-brand-antiqueGold/60 hover:bg-brand-cream/50'
                  }`}
                  onDragEnter={onDragEnter}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-brand-antiqueGold/40 bg-white">
                    <AdminIcon
                      name="products"
                      size={22}
                      className="text-brand-antiqueGoldDark"
                    />
                  </div>
                  <p className="mt-4 text-sm font-medium text-brand-espresso">
                    Drag &amp; drop images here
                  </p>
                  <p className="mt-1 text-xs text-brand-espresso/55">
                    or click to browse
                  </p>
                  <p className="mt-2 text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso/40">
                    JPG, PNG or WEBP · Maximum 5 MB each
                  </p>
                </div>

                {/* Upload error */}
                {uploadError && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg border border-brand-burgundy/25 bg-brand-burgundy/[0.06] px-4 py-3"
                  >
                    <AdminIcon
                      name="alertTriangle"
                      size={16}
                      className="mt-0.5 shrink-0 text-brand-burgundy"
                    />
                    <p className="text-sm text-brand-burgundy">{uploadError}</p>
                  </div>
                )}

                {/* Thumbnail grid */}
                {pendingUploads.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {pendingUploads.map((p, idx) => (
                      <ImageThumbnail
                        key={p.id}
                        upload={p}
                        index={idx}
                        isPrimary={idx === 0}
                        onRemove={() => removeImage(idx)}
                        onMove={moveImage}
                      />
                    ))}
                  </div>
                )}

                <p className="text-[0.625rem] uppercase tracking-[0.2em] text-brand-espresso/40">
                  {pendingUploads.length} image
                  {pendingUploads.length === 1 ? '' : 's'} · Drag a thumbnail to
                  reorder · the first image is primary
                </p>
              </div>
            )}

            {/* Section 3: Pricing */}
            {activeSection === 'pricing' && (
              <div className="space-y-5">
                <div className="rounded-xl border border-brand-antiqueGold/20 bg-white p-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="price"
                        className="mb-2 block text-xs font-medium text-brand-espresso/70"
                      >
                        Price (₹) <span className="text-brand-burgundy">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-brand-espresso/40">
                          ₹
                        </span>
                        <input
                          id="price"
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={form.price}
                          onChange={(e) => update('price', e.target.value)}
                          onBlur={() => markTouched('price')}
                          className={fieldClassName('price', 'w-full rounded-lg border border-brand-espresso/15 bg-white pl-8 pr-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25')}
                          placeholder="18900"
                        />
                      </div>
                      <p className="mt-1.5 text-[0.625rem] text-brand-espresso/40">
                        Enter the selling price in rupees
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="compare_at_price"
                        className="mb-2 block text-xs font-medium text-brand-espresso/70"
                      >
                        Compare-at price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-brand-espresso/40">
                          ₹
                        </span>
                        <input
                          id="compare_at_price"
                          type="number"
                          min="0"
                          step="1"
                          value={form.compare_at_price}
                          onChange={(e) =>
                            update('compare_at_price', e.target.value)
                          }
                          className="w-full rounded-lg border border-brand-espresso/15 bg-white pl-8 pr-4 py-2.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none focus:ring-2 focus:ring-brand-antiqueGold/25"
                          placeholder="22500"
                        />
                      </div>
                      <p className="mt-1.5 text-[0.625rem] text-brand-espresso/40">
                        Original price for sale/discount display
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Flags */}
            {activeSection === 'flags' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-brand-antiqueGold/20 bg-white p-5">
                  <div className="space-y-4">
                    {[
                      {
                        key: 'is_featured',
                        label: 'Featured',
                        description: 'Show in featured collections and editorials',
                      },
                      {
                        key: 'is_new',
                        label: 'New Arrival',
                        description: 'Mark as a new arrival',
                      },
                      {
                        key: 'is_active',
                        label: 'Active',
                        description: 'Visible in the storefront',
                      },
                    ].map((flag) => (
                      <div
                        key={flag.key}
                        className="flex items-center justify-between rounded-lg border border-brand-antiqueGold/10 bg-brand-cream/30 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-brand-espresso">
                            {flag.label}
                          </p>
                          <p className="mt-0.5 text-xs text-brand-espresso/50">
                            {flag.description}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              flag.key as keyof FormState,
                              !form[flag.key as keyof FormState],
                            )
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
                            form[flag.key as keyof FormState]
                              ? 'bg-brand-antiqueGold'
                              : 'bg-brand-espresso/15'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                              form[flag.key as keyof FormState]
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: Sizes */}
            {activeSection === 'sizes' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {form.sizes.map((size, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-antiqueGold/30 bg-brand-cream px-3.5 py-2 text-sm font-medium text-brand-espresso/80"
                    >
                      {size.name}
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            'sizes',
                            form.sizes.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-brand-espresso/40 transition-colors hover:text-brand-burgundy"
                      >
                        <AdminIcon name="close" size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                {form.sizes.length < 12 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newSize = prompt('Enter size name (e.g. XL):');
                      if (newSize?.trim()) {
                        update('sizes', [
                          ...form.sizes,
                          { name: newSize.trim() },
                        ]);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-brand-antiqueGold/40 px-3.5 py-2 text-xs font-medium text-brand-antiqueGoldDark transition-colors hover:border-brand-antiqueGold hover:bg-brand-cream"
                  >
                    <AdminIcon name="plus" size={12} />
                    Add size
                  </button>
                )}
              </div>
            )}

            {/* Section 6: Colours */}
            {activeSection === 'colors' && (
              <div className="space-y-4">
                {form.colors.length === 0 ? (
                  <p className="text-sm text-brand-espresso/40">
                    No colours added yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {form.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl border border-brand-antiqueGold/20 bg-white px-4 py-3"
                      >
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => {
                            const next = [...form.colors];
                            next[idx] = { ...next[idx], hex: e.target.value };
                            update('colors', next);
                          }}
                          className="h-9 w-9 cursor-pointer rounded-lg border border-brand-espresso/15"
                        />
                        <div className="flex-1">
                          <input
                            type="text"
                            value={color.name}
                            onChange={(e) => {
                              const next = [...form.colors];
                              next[idx] = { ...next[idx], name: e.target.value };
                              update('colors', next);
                            }}
                            placeholder="Colour name"
                            className="w-full rounded-md border border-brand-espresso/10 bg-white px-3 py-1.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              'colors',
                              form.colors.filter((_, i) => i !== idx),
                            )
                          }
                          className="shrink-0 rounded-md p-1.5 text-brand-espresso/40 transition-colors hover:bg-brand-burgundy/5 hover:text-brand-burgundy"
                        >
                          <AdminIcon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    update('colors', [
                      ...form.colors,
                      { name: '', hex: '#000000' },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-antiqueGold/40 px-4 py-2.5 text-xs font-medium text-brand-antiqueGoldDark transition-colors hover:border-brand-antiqueGold hover:bg-brand-cream"
                >
                  <AdminIcon name="plus" size={13} />
                  Add Colour
                </button>
              </div>
            )}

            {/* Section 7: Details */}
            {activeSection === 'details' && (
              <div className="space-y-4">
                {form.details.length === 0 ? (
                  <p className="text-sm text-brand-espresso/40">
                    No details added yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.details.map((detail, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl border border-brand-antiqueGold/20 bg-white px-4 py-3"
                      >
                        <input
                          type="text"
                          value={detail.label}
                          onChange={(e) => {
                            const next = [...form.details];
                            next[idx] = { ...next[idx], label: e.target.value };
                            update('details', next);
                          }}
                          placeholder="Label (e.g. Weave)"
                          className="w-1/3 rounded-md border border-brand-espresso/10 bg-white px-3 py-1.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none"
                        />
                        <input
                          type="text"
                          value={detail.value}
                          onChange={(e) => {
                            const next = [...form.details];
                            next[idx] = { ...next[idx], value: e.target.value };
                            update('details', next);
                          }}
                          placeholder="Value"
                          className="flex-1 rounded-md border border-brand-espresso/10 bg-white px-3 py-1.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              'details',
                              form.details.filter((_, i) => i !== idx),
                            )
                          }
                          className="shrink-0 rounded-md p-1.5 text-brand-espresso/40 transition-colors hover:bg-brand-burgundy/5 hover:text-brand-burgundy"
                        >
                          <AdminIcon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    update('details', [
                      ...form.details,
                      { label: '', value: '' },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-antiqueGold/40 px-4 py-2.5 text-xs font-medium text-brand-antiqueGoldDark transition-colors hover:border-brand-antiqueGold hover:bg-brand-cream"
                >
                  <AdminIcon name="plus" size={13} />
                  Add Detail
                </button>

                {/* Care instructions */}
                <div className="mt-8">
                  <h4 className="mb-3 text-[0.625rem] font-medium uppercase tracking-[0.3em] text-brand-espresso/50">
                    Care Instructions
                  </h4>
                  {form.care.length === 0 ? (
                    <p className="text-sm text-brand-espresso/40">
                      No instructions added yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {form.care.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-xl border border-brand-antiqueGold/20 bg-white px-4 py-3"
                        >
                          <input
                            type="text"
                            value={item.instruction}
                            onChange={(e) => {
                              const next = [...form.care];
                              next[idx] = { instruction: e.target.value };
                              update('care', next);
                            }}
                            placeholder="e.g. Dry clean only"
                            className="flex-1 rounded-md border border-brand-espresso/10 bg-white px-3 py-1.5 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              update(
                                'care',
                                form.care.filter((_, i) => i !== idx),
                              )
                            }
                            className="shrink-0 rounded-md p-1.5 text-brand-espresso/40 transition-colors hover:bg-brand-burgundy/5 hover:text-brand-burgundy"
                          >
                            <AdminIcon name="close" size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      update('care', [
                        ...form.care,
                        { instruction: '' },
                      ])
                    }
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-antiqueGold/40 px-4 py-2.5 text-xs font-medium text-brand-antiqueGoldDark transition-colors hover:border-brand-antiqueGold hover:bg-brand-cream"
                  >
                    <AdminIcon name="plus" size={13} />
                    Add Instruction
                  </button>
                </div>
              </div>
            )}

            {/* Section 8: Inventory / Variants */}
            {activeSection === 'inventory' && (
              <div className="space-y-4">
                {form.variants.length === 0 ? (
                  <p className="text-sm text-brand-espresso/40">
                    No variants yet. Add at least one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {form.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 gap-3 rounded-xl border border-brand-antiqueGold/20 bg-white p-4 sm:grid-cols-[1fr_1fr_100px_100px_auto]"
                      >
                        <select
                          value={v.size}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[idx] = { ...next[idx], size: e.target.value };
                            update('variants', next);
                          }}
                          className="rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso transition-colors focus:border-brand-antiqueGold focus:outline-none"
                        >
                          <option value="">Size…</option>
                          {form.sizes.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={v.color}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[idx] = { ...next[idx], color: e.target.value };
                            update('variants', next);
                          }}
                          className="rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso transition-colors focus:border-brand-antiqueGold focus:outline-none"
                        >
                          <option value="">Colour…</option>
                          {form.colors.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[idx] = {
                              ...next[idx],
                              stock: parseInt(e.target.value) || 0,
                            };
                            update('variants', next);
                          }}
                          placeholder="Stock"
                          className="rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none"
                        />
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[idx] = { ...next[idx], sku: e.target.value };
                            update('variants', next);
                          }}
                          placeholder="SKU"
                          className="rounded-lg border border-brand-espresso/10 bg-white px-3 py-2 text-sm text-brand-espresso placeholder:text-brand-espresso/35 transition-colors focus:border-brand-antiqueGold focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              'variants',
                              form.variants.filter((_, i) => i !== idx),
                            )
                          }
                          className="shrink-0 rounded-lg p-1.5 text-brand-espresso/40 transition-colors hover:bg-brand-burgundy/5 hover:text-brand-burgundy"
                        >
                          <AdminIcon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    update('variants', [...form.variants, { ...EMPTY_VARIANT }])
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-brand-antiqueGold/40 px-4 py-2.5 text-xs font-medium text-brand-antiqueGoldDark transition-colors hover:border-brand-antiqueGold hover:bg-brand-cream"
                >
                  <AdminIcon name="plus" size={13} />
                  Add Variant
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 border-t border-brand-antiqueGold/15 bg-white px-6 py-4 sm:px-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-brand-antiqueGold/30 px-5 py-2.5 text-sm font-medium text-brand-espresso/70 transition-colors hover:bg-brand-cream disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={saving}
              className="flex items-center gap-2.5 rounded-lg bg-brand-espresso px-6 py-2.5 text-sm font-medium uppercase tracking-[0.2em] text-brand-ivory transition-colors duration-300 hover:bg-brand-espressoLight disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span
                    className={`h-4 w-4 rounded-full border-2 border-brand-ivory/30 border-t-brand-ivory ${
                      reducedMotion ? '' : 'animate-spin'
                    }`}
                  />
                  Saving…
                </>
              ) : product ? (
                'Save Changes'
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
