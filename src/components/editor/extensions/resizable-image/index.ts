import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageView } from "./resizable-image-view";

export const ResizableImage = Image.extend({
  name: "resizableImage",

  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
      },
      src: {
        default: null,
      },
      originalSrc: {
        default: null,
      },
      width: {
        default: "100%",
      },
      align: {
        default: "center", // left, center, right, full
      },
      caption: {
        default: "",
      },
      rotate: {
        default: 0,
      },
      crop: {
        default: null,
      },
      loading: {
        default: false,
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
