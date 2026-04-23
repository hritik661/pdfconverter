# File-to-PDF Converter 📄

A modern, responsive web application for converting various file formats to PDF. Built with HTML, CSS, and JavaScript.

## Features ✨

- **Multiple File Format Support**
  - 🖼️ Images (JPG, PNG, GIF)
  - 📝 Documents (DOCX, PDF)
  - 📊 Spreadsheets (XLSX)

- **User-Friendly Interface**
  - Drag-and-drop file upload
  - Real-time file preview
  - Intuitive conversion options
  - Progress indication
  - Success/Error notifications

- **Advanced Conversion Options**
  - Image quality settings (High/Medium/Low)
  - Image scaling options
  - Document formatting preservation
  - Excel sheet selection
  - Column auto-fit for spreadsheets

- **Responsive Design**
  - Works on desktop, tablet, and mobile devices
  - Beautiful gradient UI
  - Smooth animations and transitions
  - Touch-friendly buttons

- **Privacy-First Approach**
  - All conversions happen locally in your browser
  - No file uploads to external servers
  - Secure and fast processing

## Supported File Types

| Format | Extensions | Features |
|--------|-----------|----------|
| Images | `.jpg`, `.jpeg`, `.png`, `.gif` | Quality selection, fit-to-page option |
| Documents | `.docx` | Format preservation |
| Spreadsheets | `.xlsx`, `.xls` | Sheet selection, column auto-fit |
| PDF | `.pdf` | Direct download without conversion |

## Installation

1. Clone or download the project files:
   ```
   - index.html
   - styles.css
   - script.js
   ```

2. Place all files in the same directory

3. Open `index.html` in your web browser

No server or installation required!

## Usage

### Basic Steps

1. **Upload a File**
   - Click the upload area or drag-and-drop a file
   - Supported formats: Images, DOCX, XLSX, PDF

2. **Review File Details**
   - Check the file preview
   - Adjust conversion options as needed

3. **Convert to PDF**
   - Click the "Convert to PDF" button
   - Wait for the conversion to complete

4. **Download**
   - Click "Download PDF" to save the converted file
   - Or choose "Convert Another" to process more files

### Conversion Options by File Type

#### Images
- **Quality Selection**: Choose between High, Medium, or Low quality
  - High: Best visual quality, larger file size
  - Medium: Balanced quality and file size (recommended)
  - Low: Smallest file size, acceptable quality

- **Fit to Page**: Automatically scale image to fit A4 page

#### Documents (DOCX)
- **Preserve Formatting**: Maintains document layout and styling

#### Spreadsheets (XLSX)
- **Sheet Selection**: Choose which sheet to convert
- **Auto-fit Columns**: Automatically resize columns to fit page width

#### PDF Files
- **Direct Download**: PDF files can be downloaded immediately without conversion

## Technical Details

### Libraries Used

- **jsPDF** (v2.5.1) - PDF document generation
- **html2canvas** (v1.4.1) - HTML to image conversion
- **Mammoth.js** (v1.6.0) - DOCX to HTML conversion
- **XLSX** (v0.18.5) - Excel file parsing

All libraries are loaded from CDN for easy setup and reliability.

### Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (use modern browsers)

### File Size Limitations

- Recommended maximum file size: 50MB
- For best performance, keep files under 10MB
- Very large files may take longer to process

## Tips for Best Results

1. **Image Conversion**
   - Use high-quality source images for best PDF quality
   - Medium quality is usually sufficient and creates smaller files

2. **Document Conversion**
   - Ensure your DOCX files are saved in modern Word format
   - Complex layouts may be converted as images

3. **Spreadsheet Conversion**
   - Use reasonable column widths for better formatting
   - Avoid very wide spreadsheets; consider splitting them
   - Formulas are converted as values

4. **General Tips**
   - Close other applications to free up memory for large files
   - Use a stable internet connection (for CDN library loading)
   - Test with a small file first to verify settings

## Troubleshooting

### File Upload Not Working
- Ensure the file format is supported
- Check that the file is not corrupted
- Try with a different browser

### Conversion Takes Too Long
- Close other applications
- Try a smaller file first
- Check your system resources

### PDF Quality Issues
- Adjust the quality settings
- Try with a higher quality source file
- Clear browser cache and reload

### Libraries Not Loading
- Check your internet connection
- Allow CDN resources (unpblock if blocked)
- Refresh the page

## Browser Console Debugging

If you encounter issues, check the browser console for error messages:
- Press `F12` or `Ctrl+Shift+I` to open Developer Tools
- Go to the "Console" tab
- Look for any error messages

## Security & Privacy

✅ **100% Local Processing**
- All files are processed in your browser
- No data is sent to external servers
- No logs are kept on any server
- Your files remain private

## Performance

- Typical conversion time: 1-5 seconds
- Image files: ~1-2 seconds
- Documents: ~2-3 seconds
- Spreadsheets: ~2-4 seconds

Processing time depends on:
- File size
- System performance
- Browser capabilities

## Limitations

- Complex Word documents with extensive formatting may not convert perfectly
- Very large Excel files may be slower to process
- Embedded media in documents will be lost
- Macros in Excel files will not be executed

## Customization

You can customize the application by editing the CSS file:

- **Colors**: Change the gradient colors in `.header` and `.btn-primary`
- **Fonts**: Modify `font-family` in the `body` selector
- **Layout**: Adjust padding and margins throughout `styles.css`
- **Dark Mode**: Add dark mode styles for nighttime usage

## License

This project is free to use and modify for personal or commercial purposes.

## Contributing

Feel free to improve this project! Some ideas:
- Add support for more file formats (PPT, PDF with images, etc.)
- Implement batch conversion
- Add dark mode theme
- Support for watermarking PDFs
- Advanced editing features

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Try with a different browser
4. Test with a different file

---

**Made with ❤️ for easy file conversion**

Enjoy converting your files to PDF! 🎉
