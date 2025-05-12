import { clearPreview } from "./filedrop";

let cameraStream = null;

$('#takePhoto').on('click', async function() {
    $('.selected-file').addClass('d-none');
    $('.file-name').text('');
    clearPreview();
  $('#camera-container').removeClass('d-none');
  const video = document.getElementById('camera-stream');
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = cameraStream;
  } catch (err) {
    alert('Could not access camera.');
  }
});

$('#closeCamera').on('click', function() {
  $('#camera-container').addClass('d-none');
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }
});

$('#capturePhoto').on('click', function() {
  const video = document.getElementById('camera-stream');
  const canvas = document.getElementById('photo-canvas');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convert canvas to Blob and simulate file selection
  canvas.toBlob(blob => {
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    // You may need to expose a setter in filedrop.js or set a global variable
    window.selectedFile = file;
    // Optionally, show the photo in the UI
    $('#image-display').html(`<img src="${URL.createObjectURL(file)}" style="max-width:100%;max-height:300px;">`);
    $('#camera-container').addClass('d-none');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
  }, 'image/jpeg');
});

// Patch getSelectedFile to return camera photo if available

window.getSelectedFile = function() {
  if (window._cameraFile) {
    const f = window._cameraFile;
    window._cameraFile = null; // reset after use
    return f;
  }
  return originalGetSelectedFile();
};

