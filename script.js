
// Google Apps Script Web App URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxv_MnmJE2RL1uNoF3Iyr6mSE1Mf6r6GVAHBVPBdTMbzGJ6f-wWpqYmpITxCz3by3Ntw/exec";

// Existing HTML elements
const camera = document.getElementById("camera");
const canvas = document.getElementById("photoCanvas");
const preview = document.getElementById("selfiePreview");
const statusText = document.getElementById("selfieStatus");

const openCamera = document.getElementById("openCamera");
const capturePhoto = document.getElementById("capturePhoto");
const retakePhoto = document.getElementById("retakePhoto");
const visitorForm = document.getElementById("visitorForm");

const visitorName = document.getElementById("visitorName");
const mobileNumber = document.getElementById("mobileNumber");
const companyName = document.getElementById("companyName");
const personToMeet = document.getElementById("personToMeet");
const purpose = document.getElementById("purpose");
const vehicleNumber = document.getElementById("vehicleNumber");

let cameraStream = null;
let selfieCaptured = false;
let selfieImage = "";
let currentMode = "IN";

// Add IN / OUT selection
const modePanel = document.createElement("div");
modePanel.style.marginBottom = "15px";
modePanel.innerHTML = `
  <button type="button" id="inMode">Visitor IN</button>
  <button type="button" id="outMode">Visitor OUT</button>
`;
visitorForm.parentNode.insertBefore(modePanel, visitorForm);

const inMode = document.getElementById("inMode");
const outMode = document.getElementById("outMode");

// Add Security PIN field
const pinInput = document.createElement("input");
pinInput.type = "password";
pinInput.id = "guardPin";
pinInput.placeholder = "Security Guard PIN";
pinInput.inputMode = "numeric";
pinInput.maxLength = 10;
pinInput.hidden = true;
pinInput.style.display = "none";

const submitButton = visitorForm.querySelector('button[type="submit"]');
visitorForm.insertBefore(pinInput, submitButton);

// Add message area
const requestStatus = document.createElement("p");
requestStatus.id = "requestStatus";
requestStatus.style.marginTop = "12px";
submitButton.insertAdjacentElement("afterend", requestStatus);

// Mobile number: only 10 digits
mobileNumber.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

// Stop camera
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
  }

  camera.srcObject = null;
}

// Start front camera
async function startCamera() {
  try {
    stopCamera();

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

// Open camera
openCamera.addEventListener("click", startCamera);

// Capture selfie
capturePhoto.addEventListener("click", function () {
  if (!cameraStream) {
    alert("Please open the camera first.");
    return;
  }

  const originalWidth = camera.videoWidth;
  const originalHeight = camera.videoHeight;

  if (!originalWidth || !originalHeight) {
    alert("Camera is not ready. Please try again.");
    return;
  }

  const scale = Math.min(1, 640 / originalWidth);

  canvas.width = Math.round(originalWidth * scale);
  canvas.height = Math.round(originalHeight * scale);

  const context = canvas.getContext("2d");

  context.translate(canvas.width, 0);
  context.scale(-1, 1);

  context.drawImage(camera, 0, 0, canvas.width, canvas.height);

  selfieImage = canvas.toDataURL("image/jpeg", 0.6);
  selfieCaptured = true;

  preview.src = selfieImage;
  preview.hidden = false;

  camera.hidden = true;
  capturePhoto.hidden = true;
  retakePhoto.hidden = false;

  statusText.textContent = "Selfie captured successfully!";

  stopCamera();
});

// Retake selfie
retakePhoto.addEventListener("click", function () {
  selfieCaptured = false;
  selfieImage = "";
  preview.src = "";
  preview.hidden = true;

  startCamera();
});

// Switch between IN and OUT
function setMode(mode) {
  currentMode = mode;
  requestStatus.textContent = "";
  pinInput.value = "";

  stopCamera();

  const entryFields = [
    visitorName,
    companyName,
    personToMeet,
    purpose,
    vehicleNumber
  ];

  const selfieElements = [
    visitorForm.querySelector("h4"),
    camera,
    canvas,
    preview,
    openCamera,
    capturePhoto,
    retakePhoto,
    statusText
  ];

  if (mode === "IN") {
    entryFields.forEach(field => {
      field.hidden = false;
    });

    visitorName.required = true;

    selfieElements.forEach(element => {
      if (element) element.hidden = false;
    });

    // Hide PIN in IN mode
    pinInput.hidden = true;
    pinInput.style.display = "none";

    submitButton.textContent = "Submit Visitor Entry";

  } else {
    entryFields.forEach(field => {
      field.hidden = true;
    });

    visitorName.required = false;

    selfieElements.forEach(element => {
      if (element) element.hidden = true;
    });

    // Show PIN in OUT mode
    pinInput.hidden = false;
    pinInput.style.display = "block";

    submitButton.textContent = "Submit Visitor Exit";
  }

  selfieCaptured = false;
  selfieImage = "";
  preview.src = "";
}

inMode.addEventListener("click", () => setMode("IN"));
outMode.addEventListener("click", () => setMode("OUT"));

// Submit IN or OUT
visitorForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const mobile = mobileNumber.value.trim();

  if (!/^[6-9][0-9]{9}$/.test(mobile)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  let data = {
    action: currentMode,
    mobile: mobile
  };

  if (currentMode === "IN") {
    if (!selfieCaptured || !selfieImage) {
      alert("Please capture visitor selfie first.");
      return;
    }

    data.name = visitorName.value.trim();
    data.company = companyName.value.trim();
    data.person = personToMeet.value.trim();
    data.purpose = purpose.value.trim();
    data.vehicle = vehicleNumber.value.trim();
    data.selfie = selfieImage;

  } else {
    const pin = pinInput.value.trim();

    if (!pin) {
      alert("Please enter Security Guard PIN.");
      return;
    }

    data.pin = pin;
  }

  submitButton.disabled = true;
  requestStatus.textContent = "Sending request...";

  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    requestStatus.textContent =
      "Request sent. Please verify the record in Google Sheet.";

    if (currentMode === "IN") {
      visitorForm.reset();
      selfieCaptured = false;
      selfieImage = "";
      preview.src = "";
      preview.hidden = true;
      camera.hidden = false;
      statusText.textContent = "Selfie not captured";
    } else {
      pinInput.value = "";
    }

  } catch (error) {
    requestStatus.textContent =
      "Request could not be sent. Please check your internet connection.";
  }

  submitButton.disabled = false;
});

// Start in IN mode
setMode("IN");
