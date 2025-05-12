import './style.css';
import './filedrop.js';      
import './camera.js'

import { API_ENDPOINTS } from './config/endpoints.js';
import { modalALert } from './modal.js';
import { clearPreview } from './filedrop.js';


//Global variable
window.selectedFile = null;

function getSelectedFile() {
  return window.selectedFile;
}

function submitfile() {
  const file = getSelectedFile();
  if (!file) {
    console.warn("No file was uploaded")
    alert('Please choose a file first!');
    return;
  }

  console.log(file.name);


  let options = {};

  // Check for checkboxes input
  $('.detection-options').each(function(){
    const $input = $(this);
    const key =  $input.prop('id');
    options[key] = $input.prop('checked');
  });


  const formData = new FormData();
  formData.append('file', file);
  formData.append('options', JSON.stringify(options))

  fetch(API_ENDPOINTS.getInformation, {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(json => {
    console.log('Upload success:', json);
    drawRectanglesInFaces(file, json);
    putPersonInformation(json, options);
      })
      .catch(err => {
        console.error('Upload error:', err);
        modalALert('ERROR', 'No se pudieron encontrar caras en la imagen');
        clearPreview();
      });
}

function drawRectanglesInFaces(file, data){
  const $preview   = $('#image-display');
  const url = URL.createObjectURL(file);

  if (file.type.startsWith('image/')) {
  const img = new Image();
  img.src = url;
  img.onload = () => {
    const canvas = $('<canvas>')[0];
    const ctx = canvas.getContext('2d');

    // Set canvas size to match the image
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0);
    const faces = data.faces;

    for (let i = 0; i < faces.length; i++) {
      const face = faces[i];
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 4;
      ctx.strokeRect(face.x, face.y, face.w, face.h);

      // Draw index number at the bottom border of the rectangle
      ctx.font = `${parseInt(face.w / 10)}px Arial`;
      ctx.fillStyle = 'red';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(
        (i + 1).toString(),
        face.x + face.w / 2,
        face.y + face.h - 4
      );
    }
    

    // Scale canvas for UI
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '300px';

    $preview.empty().append(canvas);
  };
}

}

function putPersonInformation(data, options){
  const $informationContainer = $('#subjects-information-container');
  $informationContainer.html('');

  const displayOptions = Object.keys(options).filter(key => options[key]);
  console.log("diplay opt", displayOptions)

  let i = 1;
  for(const info of data.faces){
    const result = info.results;
    

    let subjectInfo = `<span class="subject-information"> id: ${i++} <br>`;

    for(const opt of displayOptions){
      if (opt === 'age'){
        subjectInfo += `age: ${result.age} <br>`
      }
      else {
        subjectInfo += `${opt}: ${result[opt].dominant} (${(result[opt].percentage).toFixed(2)} %)<br>`
      }
    }
    subjectInfo += `</span>`
    $informationContainer.append(subjectInfo);
  }
}

$('#sendFile').on('click', submitfile);

