const toolbarItems = [
  "reset",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "|",
  "fontsizeselect",
  "forecolor",
  "|",
  "blockquote",
  "|",
  "bullist",
  "|",
  "align",
  "|",
  "image",
  "link",
  "emoticons",
  "|",
  "removeformat",
  "|",
  "code",
].join(" ");

const inlineFormattingItems =
  "bold italic underline strikethrough | fontsizeselect forecolor | blockquote";
const blockFormattingItems = "align bullist";

tinymce.init({
  selector: "textarea",
  plugins: "link image code emoticons lists",
  toolbar_location: "bottom",
  toolbar: toolbarItems,
  toolbar_mode: "floating",
  fontsize_formats: [10, 12, 16, 18, 24, 32, 48]
    .map((size) => `${size}=${size}pt`)
    .join(" "),
  skin: "torn",
  toolbar_sticky: true,
  height: 300,
  menubar: false,
  statusbar: false,
  templates: [
    {
      title: "Some title",
      description: "Some description",
      content: "Some content",
    },
  ],
  mobile: {
    toolbar_mode: "floating",
    toolbar: "reset inlineFormatting blockFormatting",
    toolbar_groups: {
      inlineFormatting: {
        icon: "format",
        tooltip: "Formatting",
        items: inlineFormattingItems,
      },
      blockFormatting: {
        icon: "align-left",
        tooltip: "Block Formatting",
        items: blockFormattingItems,
      },
    },
  },
  setup: (editor) => {
    editor.ui.registry.addButton("SubmitButton", {
      text: "POST",
      onAction: () => {
        editor.insertContent("&nbsp;<strong>It's my button!</strong>&nbsp;");
      },
    });
    editor.ui.registry.addButton("reset", {
      icon: "undo",
      onAction: () => {
        editor.setContent("");
        editor.focus();
      },
    });
  },
});
