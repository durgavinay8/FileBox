let currentFolderStructure;
let folderStructure;
let userDataFromDB;
let fileOrFolderPath = [];

const CLIENT_ID = "33ccnoieuu10tqp6257hem0blh";
const fileInput = document.getElementById("file-input");
const dragDropArea = document.getElementById("files-table-wrapper");
const searchField = document.getElementById("search-field");
const signOutbtn = document.getElementById("signout-btn");
const tableBody = document.getElementById("filesTableBody");
let loadingDiv;

document.addEventListener("DOMContentLoaded", async () => {
  await fetchAllFiles();

  displayUserEmail();
  displayFolderStructure();
});

const endLoading = async () => {
  document.body.removeChild(loadingDiv);
};
const startLoading = async (message) => {
  loadingDiv = document.createElement("div");
  loadingDiv.id = "loading";
  loadingDiv.textContent = message;
  document.body.appendChild(loadingDiv);
};

const fetchAllFiles = async () => {
  startLoading("Fetching Files...");
  try {
    const response = await fetch("/files/allFiles");
    if (!response.ok) {
      alert("Unable to fetch files");
      throw new Error("Unable to fetch files");
    }

    ({ userDataFromDB, folderStructure } = await response.json());
    currentFolderStructure = folderStructure;
    fileOrFolderPath = [];
    const filePathElement = document.getElementById("file-path");
    filePathElement.innerText = "";
  } catch (error) {
    endLoading();
    alert("failed to fetch files");
    return {};
  }
  updateInfoPanel();

  endLoading();
};

const displayUserEmail = async () => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split("=");
    if (cookieName === "email") {
      const emailElement = document.getElementById("user-email");
      emailElement.innerText = decodeURIComponent(cookieValue);
    }
  }
};

const displayFolderStructure = async () => {
  startLoading("Displaying Files...");
  tableBody.innerHTML = "";
  let rowIndex = 0;
  for (const fileOrFolder in currentFolderStructure) {
    if (fileOrFolder === "") {
      continue;
    }

    const row = tableBody.insertRow(-1);
    const fileKey = currentFolderStructure[fileOrFolder]["fileKey"];

    const nameCell = document.createElement("td");
    nameCell.textContent = fileOrFolder;
    if (fileKey) {
      nameCell.addEventListener("click", () => {
        viewFile(fileKey);
      });
    } else {
      nameCell.addEventListener("click", () => {
        updatePathIN(fileOrFolder);
      });
    }
    row.appendChild(nameCell);

    const sizeCell = document.createElement("td");
    sizeCell.textContent = currentFolderStructure[fileOrFolder]["fileSize"]
      ? formatFileSize(currentFolderStructure[fileOrFolder]["fileSize"])
      : "N/A";
    row.appendChild(sizeCell);

    const lastModifiedCell = document.createElement("td");
    lastModifiedCell.textContent =
      currentFolderStructure[fileOrFolder]["lastModified"] || "N/A";
    row.appendChild(lastModifiedCell);

    const downloadCell = document.createElement("td");
    if (fileKey) {
      downloadCell.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i>';
      downloadCell.addEventListener("click", () => {
        downloadFile(fileKey, fileOrFolder);
      });
    } else {
      downloadCell.innerHTML = "-";
    }

    row.appendChild(downloadCell);

    const deleteCell = document.createElement("td");
    deleteCell.innerHTML = '<i class="fa-solid fa-trash"></i>';
    if (fileKey) {
      deleteCell.addEventListener("click", (event) => {
        deleteFile(event, fileOrFolder, fileKey);
      });
    } else {
      deleteCell.addEventListener("click", (event) => {
        deleteFolder(event, fileOrFolder);
      });
    }
    row.appendChild(deleteCell);

    ++rowIndex;
  }
  endLoading();
};

function formatFileSize(bytes) {
  if (bytes == 0) return "0 Bytes";
  var k = 1000,
    dm = 2,
    sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const updateInfoPanel = () => {
  storagePercentCircle(
    userDataFromDB.Total_storage,
    userDataFromDB.Used_storage
  );
  document.getElementById("total-storage-value").textContent =
    userDataFromDB.Total_storage;
  document.getElementById("used-storage-value").textContent =
    userDataFromDB.Used_storage;
  document.getElementById("left-storage-value").textContent =
    userDataFromDB.Total_storage - userDataFromDB.Used_storage;

  updateFilesCount(
    userDataFromDB.image_count,
    userDataFromDB.videos_count,
    userDataFromDB.document_count,
    userDataFromDB.other_count
  );
};

const storagePercentCircle = async (total_storage, storage_occupied) => {
  let percentage = (storage_occupied * 100) / total_storage;
  let circularProgress = document.querySelector(".circular-progress"),
    progressValue = document.querySelector(".progress-value");
  let progressStartValue = 0,
    progressEndValue = percentage,
    percentageValue = 0,
    speed = 15;
  let progress = setInterval(() => {
    if (progressStartValue < progressEndValue) {
      progressStartValue += 0.1;
      progressValue.textContent = `${progressStartValue}%`;
      percentageValue += 0.36;
      circularProgress.style.background = `conic-gradient(#0096C7 ${percentageValue}deg, #ededed 0deg)`;
    } else {
      clearInterval(progress);
      progressValue.textContent = `${progressStartValue.toFixed(2)}%`;
    }
  }, speed);
};
/*
function Search(){
    let input=searchField.value;
    searchField.value="";
    for(let key in currentFolderStructure){
        let fileKey = currentFolderStructure[fileOrFolder]["fileKey"];
        if(fileKey){
            if(key===input){
                tableBody.innerHTML = '';
                const row = tableBody.insertRow(-1);

                const nameCell = document.createElement('td');
                nameCell.textContent = fileOrFolder;
                if(fileKey){
                    nameCell.addEventListener('click',()=>{
                    viewFile(fileKey);
                });
                }else{
                    nameCell.addEventListener('click',()=>{
                    updatePathIN(fileOrFolder);
                });
                }
                row.appendChild(nameCell);
                
                const sizeCell = document.createElement('td');
                sizeCell.textContent = currentFolderStructure[fileOrFolder]["fileSize"] || 'N/A';
                row.appendChild(sizeCell);
        
                const lastModifiedCell = document.createElement('td')
                lastModifiedCell.textContent = currentFolderStructure[fileOrFolder]["lastModified"]  || 'N/A';
                row.appendChild(lastModifiedCell);

                const downloadCell = document.createElement('td');
                if(fileKey){
                    downloadCell.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i>';
                    downloadCell.addEventListener('click',()=>{
                    downloadFile(fileKey, fileOrFolder);
                    });
                }else{
                    downloadCell.innerHTML = "-";
                }
        
                row.appendChild(downloadCell);
        
                const deleteCell = document.createElement('td');
                deleteCell.innerHTML = '<i class="fa-solid fa-trash"></i>';
                if(fileKey){
                    deleteCell.addEventListener('click',(event)=>{
                    deleteFile(event,fileOrFolder, fileKey);
                    });
                }else{
                    deleteCell.addEventListener('click',(event)=>{
                    deleteFolder(event,fileOrFolder);
                    });
                }
                row.appendChild(deleteCell);
                return;
            }
        }
    }
    alert("File Not Found");
}
*/
fileInput.addEventListener("change", async () => {
  await uploadFiles(fileInput.files);
});

dragDropArea.addEventListener("dragover", (event) => {
  event.preventDefault();
  dragDropArea.className = "highlight";
});

dragDropArea.addEventListener("dragleave", (event) => {
  event.preventDefault();
  dragDropArea.className = "";
});

dragDropArea.addEventListener("drop", async (event) => {
  event.preventDefault();
  dragDropArea.className = "";
  await uploadFiles(event.dataTransfer.files);
});

const updatePathIN = async (folderName) => {
  fileOrFolderPath.push(folderName);

  const filePathElement = document.getElementById("file-path");
  let pathString = "";
  fileOrFolderPath.forEach((fileOrFolderName) => {
    pathString = pathString + fileOrFolderName + " > ";
  });
  filePathElement.innerText = pathString;
  await changeCurrentFolderIN(folderName);
  await displayFolderStructure();
};

const changeCurrentFolderIN = async (folderName) => {
  currentFolderStructure = currentFolderStructure[folderName];
};

const updatePathOUT = async () => {
  if (fileOrFolderPath.length === 0) {
    return;
  }

  fileOrFolderPath.pop();

  // another way is to keep div in a flex container and put last as className then remove it
  const filePathElement = document.getElementById("file-path");
  let pathString = "";
  currentFolderStructure = folderStructure;

  fileOrFolderPath.forEach((fileOrFolderName) => {
    pathString = pathString + fileOrFolderName + " > ";

    currentFolderStructure = currentFolderStructure[fileOrFolderName];
  });
  filePathElement.innerText = pathString;
  await displayFolderStructure();
};

const viewFile = async (fileKey) => {
  startLoading("Viewing File...");

  const response = await fetch(
    `/files/presignedUrl?fileKey=${encodeURIComponent(fileKey)}`,
    {
      method: "GET",
    }
  );
  if (!response.ok) {
    alert("Unable to view file");
    throw new Error("Unable to view file");
  }
  //I can link this to downloadFile to save ...
  const preSignedUrl = await response.json();
  endLoading();

  window.open(preSignedUrl["presigned_url"], "_blank");
};

const downloadFile = async (fileKey, downloadAs) => {
  startLoading("Downloading File...");

  const response = await fetch(
    `/files/presignedUrl?fileKey=${encodeURIComponent(fileKey)}`,
    {
      method: "GET",
    }
  );
  if (!response.ok) {
    alert("Unable to get download file");
    throw new Error("Unable to get download file");
  }
  const preSignedUrl = await response.json();

  const tempAnchor = document.createElement("a");
  tempAnchor.href = preSignedUrl;
  tempAnchor.setAttribute("download", downloadAs);

  document.body.appendChild(tempAnchor);
  tempAnchor.click();
  document.body.removeChild(tempAnchor);

  endLoading();
};

const deleteFile = async (event, fileName, fileKey) => {
  //to-do : count & size
  if (confirm("Are you sure want to delete this file " + fileName)) {
    startLoading("Deleting File...");

    const response = await fetch(
      `/files/delete?fileKey=${encodeURIComponent(fileKey)}`,
      {
        method: "DELETE",
      }
    );
    if (response.ok) {
      console.log("Successfully deleted the file");
      endLoading();

      await fetchAllFiles();
      await displayFolderStructure();
    } else {
      endLoading();
      alert("failed to delete the file");
    }
  }
};

const deleteFolder = async (event, folderName) => {
  //to-do : count & size
  if (confirm("Are you sure want to delete this file " + folderName)) {
    startLoading("Deleting Folder...");
    let folderKey = "";
    for (let i = 0; i < fileOrFolderPath.length; ++i) {
      folderKey = folderKey + fileOrFolderPath[i] + "/";
    }
    folderKey += folderName + "/";

    const response = await fetch(
      `/files/delete?fileKey=${encodeURIComponent(folderKey)}&folder=true`,
      {
        method: "DELETE",
      }
    );
    if (response.ok) {
      console.log("Successfully deleted the folder");
      endLoading();

      await fetchAllFiles();
      await displayFolderStructure();
    } else {
      endLoading();
      alert("failed to delete the folder");
    }
  }
};

const uploadFiles = async (files) => {
  startLoading("Uploading Files...");
  const formData = new FormData();

  let folderPath = "";
  for (let i = 0; i < fileOrFolderPath.length; ++i) {
    folderPath = folderPath + fileOrFolderPath[i];
    if (i != fileOrFolderPath.length - 1) {
      folderPath += "/";
    }
  }
  formData.append("folderPath", folderPath);

  for (const file of files) {
    formData.append("files", file, file.name);
  }

  try {
    const response = await fetch("/files/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      console.log("Successfully uploaded the file");
      endLoading();
      await fetchAllFiles();
      await displayFolderStructure();
    } else {
      endLoading();
      alert("failed to upload the file");
    }
  } catch (error) {
    console.error("Error:", error);
    endLoading();
    alert("Error uploading files");
  }
};

document.getElementById("create-folder").addEventListener("click", async () => {
  let folderName = prompt("Please enter the folder name");
  if (folderName == null) {
    alert("Enter the folder name!");
    return;
  }

  startLoading("creating Folder...");
  let folderPath = "";
  for (let i = 0; i < fileOrFolderPath.length; ++i) {
    folderPath = folderPath + fileOrFolderPath[i] + "/";
  }
  folderPath += folderName + "/";
  console.log();
  try {
    const response = await fetch("/files/createFolder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folderPath: folderPath,
      }),
    });

    if (response.ok) {
      console.log("Successfully created the folder");
      endLoading();

      await fetchAllFiles();
      await displayFolderStructure();
    } else {
      endLoading();
      alert("failed to create the folder");
    }
  } catch (error) {
    endLoading();
    console.error("Error:", error);
    alert("Error creating the folder");
  }
});

const signOut = async () => {
  startLoading("Logging out...");
  try {
    const response = await fetch("/logout", {
      method: "GET",
    });
    endLoading();
    if (response.ok) {
      const logoutUrl = `https://filebox-user-authentication.auth.eu-north-1.amazoncognito.com/logout?client_id=${encodeURIComponent(
        CLIENT_ID
      )}&logout_uri=${encodeURIComponent("http://localhost:5000/homepage")}`;
      window.location.replace(logoutUrl);
    }
  } catch (err) {
    endLoading();
    console.log("failed to revoke tokens");
    alert("Failed to log out");
  }
};

const updateFilesCount = async (
  imagesCount,
  videosCount,
  documentsCount,
  othersCount
) => {
  let imageRow = document.querySelector(".images-count"),
    videosRow = document.querySelector(".videos-count"),
    documentsRow = document.querySelector(".documents-count"),
    othersRow = document.querySelector(".others-count");
  imageRow.textContent = `${imagesCount}`;
  videosRow.textContent = `${videosCount}`;
  documentsRow.textContent = `${documentsCount}`;
  othersRow.textContent = `${othersCount}`;
};
