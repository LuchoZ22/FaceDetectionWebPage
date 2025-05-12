const $dropZone  = $('.drop-zone-container');
const $input     = $('#fileInput');
const $browse    = $('#addFile');
const $fileInfo  = $('.selected-file');
const $fileName  = $('.file-name');
const $clearBtn  = $('#clearFile');


function handleFile(file) {
    clearPreview();
    if (!file) return;

  window.selectedFile = file;

  $fileName.text(file.name);
  $fileInfo.removeClass('d-none');
}


$browse.on('click', () => $input.trigger('click'));

$input.on('change', function() {
    clearPreview();
  handleFile(this.files[0]);
});

$dropZone.on('dragenter dragover', e => {
  e.preventDefault(); e.stopPropagation();
  $dropZone.addClass('dragover');
});
$dropZone.on('dragleave dragend drop', e => {
  e.preventDefault(); e.stopPropagation();
  $dropZone.removeClass('dragover');
});
$dropZone.on('drop', e => {
  const dt = e.originalEvent.dataTransfer;
  if (dt?.files?.length) handleFile(dt.files[0]);
});

$clearBtn.on('click', () => {
    window.selectedFile = null;
    $input.val('');
    $fileInfo.addClass('d-none');
    $fileName.text('');
    clearPreview();
});


export function clearPreview(){
    $fileInfo.addClass('d-none');
    $fileName.text('');
    $('#image-display').empty();
    $('#subjects-information-container').empty();
}

