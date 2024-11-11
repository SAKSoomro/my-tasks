import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBV-1U_tp5h2luiQMZJTiuHOh1X-Cg_y0",
  authDomain: "tasks-16d25.firebaseapp.com",
  projectId: "tasks-16d25",
  storageBucket: "tasks-16d25.firebasestorage.app",
  messagingSenderId: "623605334918",
  appId: "1:623605334918:web:bc994407c105947540e207",
  measurementId: "G-4XK85KJ2W9",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const main = document.getElementById("main-content");
const headerAuth = document.getElementById("header-auth");
const footer = document.getElementById("main-footer");
const modalOverlay = document.querySelector(".modal-overlay");

let uid = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    uid = user.uid;
    document.body.style.backgroundColor = "#F3F3F3";

    const tasksCollectionRef = collection(db, "tasks");

    const tasksQuery = query(tasksCollectionRef, where("uid", "==", uid));

    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
      let tasks = [];
      querySnapshot.forEach((doc) => {
        tasks.push({
          id: doc.id,
          timeLeft: getTimeLeft(doc.data().deadline),
          ...doc.data(),
        });
      });
      main.innerHTML = `
        <div class="tasks">
          <div class="new-task-wrapper">
            <div class="ntw-header">
              <h2>Create a New Task</h2>
              <p id="ntw-close-btn" class="close-btn">x</p>
            </div>
            <form id="createNewTask">
              <fieldset>
                <label>Title</label>
                <input type="text" name="title" />
              </fieldset>
              <fieldset>
                <label>Select Deadline</label>
                <input type="date" name="deadline" />
              </fieldset>
              <fieldset>
                <label>Note</label>
                <textarea name="note" rows="6 "></textarea>
              </fieldset>
              <button class="btn-wide" type="submit">Create</button>
            </form>
          </div>
          <div class="new-task-btn">+</div>
          <div class="show-task-wrapper">
              <div class="std-header">
                <h2 id="std-title"></h2>
                <p id="std-close-btn" class="close-btn"><img src="close-48.png" alt="close button" /></p>
              </div>
            <div class="std-group">
              <div class="std-data">
                <h4>Deadline</h4>
                <p id="std-deadline"></p>
              </div>
              <div class="std-data">
                <h4>Finished</h4>
                <p id="std-finished">False</p>
              </div>
            </div>
            <div class="std-data">
              <h4>Note</h4>
              <p id="std-note"></p>
            </div>
            <button id="completeTask" class="btn-wide">Mark as Completed</button>
            <button id="deleteTask" class="btn-wide btn-danger">Delete Task</button>
        </div>
          <div class="tasks">
            ${tasks
              .map((task) => {
                return `
                <div class="task" data-task-id="${task.id}">
                  <div>
                    <p>${task.title}</p>
                    <h1>${task.finished ? "Yes" : "No"}</h1>
                  </div>
                  <div class="task-timeleft">
                   <img src="time-24.png" alt="task time left icon" />
                   <span id="timeLeft">${task.timeLeft}</span>
                  </div>
                </div>
            `;
              })
              .join("")}
          </div>
        </div>
        `;

      const closeNTW = document.getElementById("ntw-close-btn");
      const closeSTD = document.getElementById("std-close-btn");
      const newTaskWrapper = document.querySelector(".new-task-wrapper");
      const showTaskWrapper = document.querySelector(".show-task-wrapper");
      const newTaskButton = document.querySelector(".new-task-btn");
      const createNewTaskForm = document.getElementById("createNewTask");

      document.querySelectorAll(".task").forEach((taskElement) => {
        taskElement.addEventListener("click", (e) => {
          const taskId = e.currentTarget.dataset.taskId;
          const selectedTask = tasks.find((task) => task.id === taskId);
          document.getElementById("std-title").innerHTML = selectedTask.title;
          document.getElementById("std-deadline").innerHTML =
            selectedTask.deadline;
          document.getElementById("std-note").innerHTML = selectedTask.note;
          document.getElementById("std-finished").innerHTML =
            selectedTask.finished ? "Yes" : "No";
          modalOverlay.style.display = "block";
          showTaskWrapper.style.display = "block";
          const completeTaskButton = document.getElementById("completeTask");
          completeTaskButton.innerText = selectedTask.finished
            ? "Mark as Uncompleted"
            : "Mark as Completed";
          completeTaskButton.addEventListener("click", () => {
            toggleTaskFinished(taskId, !selectedTask.finished);
          });
          const deleteTaskButton = document.getElementById("deleteTask");
          deleteTaskButton.addEventListener("click", async () => {
            const taskRef = doc(db, "tasks", taskId);
            try {
              await deleteDoc(taskRef);
              modalOverlay.style.display = "none";
              showTaskWrapper.style.display = "none";
            } catch (error) {
              console.error("Error deleting task:", error);
            }
          });
        });
      });

      closeNTW.addEventListener("click", () => {
        modalOverlay.style.display = "none";
        newTaskWrapper.style.display = "none";
      });

      closeSTD.addEventListener("click", () => {
        modalOverlay.style.display = "none";
        showTaskWrapper.style.display = "none";
      });

      newTaskButton.addEventListener("click", () => {
        modalOverlay.style.display = "block";
        newTaskWrapper.style.display = "block";
      });

      createNewTaskForm.onsubmit = (e) => {
        e.preventDefault();

        const formData = new FormData(createNewTaskForm);
        const taskCollectionRef = collection(db, "tasks");

        addDoc(taskCollectionRef, {
          title: formData.get("title"),
          deadline: formData.get("deadline"),
          note: formData.get("note"),
          uid: uid,
          finished: false,
        })
          .then(() => {
            console.log("task created success!");
            modalOverlay.style.display = "none";
            newTaskWrapper.style.display = "none";
          })
          .catch((error) => {
            console.error("something went wrong with creating task!: ", error);
          });
      };

      function toggleTaskFinished(taskId, newStatus) {
        const taskDocRef = doc(db, "tasks", taskId);

        updateDoc(taskDocRef, {
          finished: newStatus,
        })
          .then(() => {
            modalOverlay.style.display = "none";
            showTaskWrapper.style.display = "none";
          })
          .catch((error) => {
            console.error("Error updating task status: ", error);
          });
      }
    });

    headerAuth.innerHTML = `
          <div class="header-profile">
            <div class="hp-thumbnail">
              <img src="${user.photoURL}" alt="avatar" />
            </div>
            <ul class="hp-options">
              <li id="displayName">${user.displayName}</li>
              <hr />
              <li id="btn-logout">Logout</li>
            </ul>
          </div>
      `;

    const logoutButton = document.getElementById("btn-logout");
    logoutButton.addEventListener("click", () => {
      signOut(auth)
        .then(() => {
          console.log("User signed out");
        })
        .catch((error) => {
          console.error("Error user sign-out:", error);
        });
    });
  } else {
    headerAuth.innerHTML = `
      <p class="btn-outline" id="btn-login">Login</p>
      `;

    main.innerHTML = `
        <div class="container">
          <div class="hero">
            <div class="hero-text">
              Minimalist <br />
              Task Management <br />
              App
            </div>
            <div class="hero-media">
              <img src="min-my-tasks.png" alt="my tasks showcase" />
            </div>
          </div>
          <div class="features">
            <h1 class="block-title">Why The Tasks?</h1>
            <ul>
              <li><h2>Less Overwhelming to use</h2></li>
              <li><h2>Less Friction To Get Started</h2></li>
              <li><h2>Sync Tasks accross All devices</h2></li>
              <li><h2>Privacy-First, Focused</h2></li>
              <li><h2>Free & Open-Source</h2></li>
            </ul>
          </div>
          <div class="legal-page-content"></div>
        </div>
      `;

    footer.innerHTML = `
        <ul>
          <li><a href="#about" id="about">About</a></li>
          <li><a href="#faq" id="faq">FAQ</a></li>
          <li><a href="#legal" id="legal">Legal</a></li>
          <li><a href="https://github.com/SAKSoomro/my-tasks" target=”_blank”>GitHub</a></li>
        </ul>
      `;

    const loginButton = document.getElementById("btn-login");
    loginButton.addEventListener("click", () => {
      signInWithPopup(auth, provider)
        .then((result) => {
          const user = result.user;
          const userDocRef = doc(collection(db, "users"), user.uid);

          setDoc(userDocRef, {
            name: user.displayName,
            avatar: user.photoURL,
            email: user.email,
          })
            .then(() => {
              console.log("Login with Google Success!");
            })
            .catch((error) => {
              console.error("Error login with Google, Try Again!: ", error);
              signOut(auth);
            });
        })
        .catch((error) => {
          console.log(error);
        });
    });

    const legalPageContent = document.querySelector(".legal-page-content");

    function openLegalPage(contentHtml) {
      modalOverlay.style.display = "block";
      legalPageContent.style.display = "block";
      legalPageContent.innerHTML = contentHtml;

      document.querySelector(".lpc-close-btn").addEventListener("click", () => {
        modalOverlay.style.display = "none";
        legalPageContent.style.display = "none";
      });
    }

    document.getElementById("about").addEventListener("click", () => {
      const aboutContent = `
        <div class="lpc-header">
          <h2 class="block-title">About</h2>
          <img src="close-48.png" alt="close button" class="lpc-close-btn" />
        </div>
        <p>Created and managed by X/@xioaib, an indie-app developer</p>
        <div class="gap-4"></div>
        <p>The Tasks — is a minimalist app task management app, privacy-focused, free forever, open-source.</p>
        <div class="gap-4"></div>
        <p>Sync across devices, less-friction to get started, pretty minimalist is the way to get started easily, without hours in customizing the app.</p>
        <div class="gap-4"></div>
        <p>Goal is to make you productive while saving your time.</p>
      `;
      openLegalPage(aboutContent);
    });

    document.getElementById("faq").addEventListener("click", () => {
      const faqContent = `
        <div class="lpc-header">
          <h2 class="block-title">FAQ</h2>
          <img src="close-48.png" alt="close button" class="lpc-close-btn" />
        </div>
        <ul class="faq-list">
          <li>
            <h3>Does this app support sync to different devices?</h3>
            <p>Yes, this app sync your all tasks to cloud, and can be used across many devices. Currently only web version is live, but soon will be available for other platforms.</p>
          </li>
          <li>
            <h3>Is this app secure to use?</h3>
            <p>This app is completely secure to use, we don't share the data, no one sees the data, as there is no team, only created and managed by one person, soon this app will be completely encrypted.</p>
          </li>
          <li>
            <h3>Can I recover the deleted data?</h3>
            <p>No, because we don't collect or make back up of your users' data, it's users' data, only they can read or manage it, once deleted it's not recoverable.</p>
          </li>
        <ul>
      `;
      openLegalPage(faqContent);
    });

    document.getElementById("legal").addEventListener("click", () => {
      const legalContent = `
        <div class="lpc-header">
          <h2 class="block-title">Privacy Policy</h2>
          <img src="close-48.png" alt="close button" class="lpc-close-btn" />
        </div>
        <ul class="faq-list">
          <li>
            <h3>Data Collection</h3>
            <p>We collect basic information from your Google account (name, email, profile picture) for authentication. We do not store passwords.</p>
          </li>
          <li>
            <h3>Data Usage</h3>
            <p>Your data is used solely for authentication and to personalize your experience within the app.</p>
          </li>
          <li>
            <h3>Data Security</h3>
            <p>Your data is securely stored and transmitted using industry-standard encryption. We use on Google’s API for authentication.</p>
          </li>
          <li>
            <h3>Data Sharing</h3>
            <p>We do not share, sell, or rent your personal data to third parties.</p>
          </li>
          <li>
            <h3>Data Retention</h3>
            <p>Your data is retained for as long as your account is active. If you delete your account, all personal data will be permanently removed.</p>
          </li>
        </ul>
      `;
      openLegalPage(legalContent);
    });
  }
});

function getTimeLeft(targetDate) {
  const target = new Date(targetDate);
  const now = new Date();

  const diffInMs = target - now;

  if (diffInMs <= 0) {
    return "Time's up!";
  }

  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffInDays / 365);
  const months = Math.floor((diffInDays % 365) / 30);
  const days = diffInDays % 30;

  let timeLeft = "";

  if (years > 0) {
    timeLeft += `${years} year${years > 1 ? "s" : ""}`;
  }
  if (months > 0) {
    if (timeLeft) timeLeft += ", ";
    timeLeft += `${months} month${months > 1 ? "s" : ""}`;
  }
  if (days > 0 || (!years && !months)) {
    if (timeLeft) timeLeft += ", ";
    timeLeft += `${days} day${days > 1 ? "s" : ""}`;
  }

  timeLeft += " left";
  return timeLeft;
}
