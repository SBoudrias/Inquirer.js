const fs = require("fs");
const path = require("path");
const inquirer = require("..");

const selectedFiles = new Set();
let location = process.cwd();
const FINISHED = "FINISHED";
const CHECKMARK = "\u2713";
let lastFileSelected = null;

function ask() {
  console.clear();

  /**
   * selected files will have a checkmark next to them
   */
  const choices = fs.readdirSync(location).map((s) => {
    const value = path.join(location, s);
    const name = `${s} ${selectedFiles.has(value) ? CHECKMARK : ""}`;

    return {
      name,
      value,
    };
  });

  /**
   * add option for user to go up a directory
   */
  if (location != process.cwd()) {
    choices.push({
      name: "..",
      value: path.join(location, ".."),
    });
  }

  /**
   * add option for user to indicate they're done selecting files
   */
  if (selectedFiles.size) {
    choices.push({
      name: FINISHED,
      value: FINISHED,
    });
  }

  inquirer
    .prompt([
      {
        type: "list",
        message: "Select files",
        name: "selection",
        choices,
        default: () => lastFileSelected
      },
    ])
    .then(({ selection }) => {
      if (selection === FINISHED) {
        selectedFiles.forEach((selectedFile) => console.log(selectedFile));
        return;
      }

      if (fs.statSync(selection).isFile()) {
        if (selectedFiles.has(selection)) {
          selectedFiles.delete(selection);
        } else {
          selectedFiles.add(selection);
        }
        lastFileSelected = selection;
      } else {
        location = selection;
        lastFileSelected = null;
      }

      ask();
    });
}

ask();
