
const camera = document.getElementById("camera");
const canvas = document.getElementById("photoCanvas");
const preview = document.getElementById("selfiePreview");
const statusText = document.getElementById("selfieStatus");

const openCamera = document.getElementById("openCamera");
const capturePhoto = document.getElementById("capturePhoto");
const retakePhoto = document.getElementById("retakePhoto");
const visitorForm = document.getElementById("visitorForm");
const mobileNumber = document.getElementById("mobileNumber");

// Allow only 10 digits
mobileNumber.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 10);
});
let cameraStream = null;
let selfieCaptured = false;
let selfieImage = "";

// Start front camera
async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    camera.srcObject = cameraStream;
    await camera.play();

    camera.hidden = false;
    preview.hidden = true;
    capturePhoto.hidden = false;
    retakePhoto.hidden = true;

    statusText.textContent = "Camera ready. Capture your selfie.";

  } catch (error) {
    alert("Unable to open camera. Please allow camera permission.");
  }
}

// Stop camera
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  camera.srcObject = null;
}

// Open camera button
openCamera.addEventListener("click", startCamera);

// Capture selfie
capturePhoto.addEventListener("click", function () {
  if (!cameraStream) {
    alert("Please open the camera first.");
    return;
  }

  canvas.width = camera.videoWidth;
  canvas.height = camera.videoHeight;

  const context = canvas.getContext("2d");

  context.translate(canvas.width, 0);
  context.scale(-1, 1);

  context.drawImage(
    camera,
    0,
    0,
    canvas.width,
    canvas.height
  );

  selfieImage = canvas.toDataURL("image/jpeg", 0.85);
  selfieCaptured = true;

  preview.src = selfieImage;
  preview.hidden = false;

  camera.hidden = true;
  capturePhoto.hidden = true;
  retakePhoto.hidden = false;

  statusText.textContent = "Selfie captured successfully!";

  stopCamera();
});

// Retake selfie button
retakePhoto.addEventListener("click", function () {
  selfieCaptured = false;
  selfieImage = "";
  preview.src = "";
  preview.hidden = true;

  startCamera();
});

// Submit form (testing only)
visitorForm.addEventListener("submit", function (event) {
  event.preventDefault();

  if (!selfieCaptured) {
    alert("Please capture visitor selfie first.");
    return;
  }

  alert("Selfie and visitor form test successful! Google Sheets connection will be added next.");
});
