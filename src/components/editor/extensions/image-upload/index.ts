import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { uploadImage, ALLOWED_IMAGE_TYPES } from "@/services/cloudinary/uploadImage";
import { toast } from "sonner";

export const ImageUpload = Extension.create({
  name: "imageUpload",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("imageUpload"),
        props: {
          handlePaste: (view, event) => {
            const items = Array.from(event.clipboardData?.items || []);
            const images = items.filter(item => item.type.startsWith("image/"));
            
            if (images.length === 0) return false;
            
            event.preventDefault();
            
            images.forEach(item => {
              const file = item.getAsFile();
              if (file) handleImageUpload(file, view, view.state.selection.from);
            });
            
            return true;
          },
          handleDrop: (view, event, _slice, moved) => {
            if (!event.dataTransfer || moved) return false;
            const files = Array.from(event.dataTransfer.files);
            const images = files.filter(file => file.type.startsWith("image/"));
            
            if (images.length === 0) return false;
            
            event.preventDefault();
            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
            const pos = coordinates ? coordinates.pos : view.state.selection.from;
            
            images.forEach(file => {
              handleImageUpload(file, view, pos);
            });
            
            return true;
          },
        },
      }),
    ];
  },
});

export function handleImageUpload(file: File, view: any, pos: number) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    toast.error("Invalid file type. Please upload an image.");
    return;
  }

  const id = Math.random().toString(36).substring(7);
  
  // Insert loading placeholder
  const tr = view.state.tr;
  const node = view.state.schema.nodes.resizableImage.create({
    id,
    loading: true,
  });
  
  tr.insert(pos, node);
  view.dispatch(tr);

  // Upload
  uploadImage(file)
    .then(url => {
      // Find the node by ID and update it
      const { tr } = view.state;
      let posFound: number | null = null;
      tr.doc.descendants((node: any, pos: number) => {
        if (node.type.name === "resizableImage" && node.attrs.id === id) {
          posFound = pos;
        }
      });

      if (posFound !== null) {
        tr.setNodeMarkup(posFound, null, {
          ...view.state.doc.nodeAt(posFound)?.attrs,
          src: url,
          originalSrc: url,
          loading: false,
          id: null
        });
        view.dispatch(tr);
      }
    })
    .catch(err => {
      console.error(err);
      // Remove loading placeholder on error
      const { tr } = view.state;
      let posFound: number | null = null;
      tr.doc.descendants((node: any, pos: number) => {
        if (node.type.name === "resizableImage" && node.attrs.id === id) {
          posFound = pos;
        }
      });
      if (posFound !== null) {
        tr.delete(posFound, posFound + 1);
        view.dispatch(tr);
      }
      toast.error(err.message);
    });
}

export function triggerImageUpload(editor: any) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ALLOWED_IMAGE_TYPES.join(",");
  input.onchange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, editor.view, editor.state.selection.from);
    }
  };
  input.click();
}
