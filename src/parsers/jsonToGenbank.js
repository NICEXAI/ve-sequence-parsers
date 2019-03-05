/* eslint-disable no-var*/
const { cloneDeep, map, each } = require("lodash");
var nameUtils = require("./utils/NameUtils.js");
var StringUtil = {
  /** Trims white space at beginning and end of string
   * @param {String} line
   * @returns {String} line
   */
  trim: function(line) {
    return line.replace(/^\s+|\s+$/g, "");
  },

  /** Trims white space at beginning string
   * @param {String} line
   * @returns {String} line
   */
  ltrim: function(line) {
    return line.replace(/^\s+/, "");
  },

  /** Trims white space at end of string
   * @param {String} line
   * @returns {String} line
   */
  rtrim: function(line) {
    return line.replace(/\s+$/, "");
  },

  /** Pads white space at beginning of string
   * @param {String} line
   * @returns {String} line
   */
  lpad: function(line, padString, length) {
    var str = line;
    while (str.length < length) str = padString + str;
    return str;
  },

  /** Pads white space at end of string
   * @param {String} line
   * @returns {String} line
   */
  rpad: function(line, padString, length) {
    var str = line;
    while (str.length < length) str = str + padString;
    return str;
  }
};

function cutUpArray(val, start, end) {
  return val.slice(start, end).join("");
}

function cutUpStr(val, start, end) {
  return val.slice(start, end);
}

module.exports = function(_serSeq, options) {
  options = options || {};
  options.reformatSeqName = options.reformatSeqName !== false;
  const serSeq = cloneDeep(_serSeq);
  if (!serSeq) return false;

  try {
    if (serSeq.isProtein || serSeq.type === "protein" || serSeq.type === "AA") {
      serSeq.isProtein = true;
      serSeq.sequence = serSeq.proteinSequence || serSeq.sequence;
      options.isProtein = true;
    }
    var content = null;
    var cutUp = typeof serSeq.sequence === "string" ? cutUpStr : cutUpArray;
    if (!serSeq.sequence) serSeq.sequence = "";

    var lines = [];
    lines.push(createGenbankLocus(serSeq, options));
    if (serSeq.definition || serSeq.description) {
      lines.push("DEFINITION  " + (serSeq.definition || serSeq.description));
    }

    if (serSeq.extraLines) {
      lines = lines.concat(serSeq.extraLines);
    }
    if (serSeq.comments) {
      serSeq.comments.forEach(function(comment) {
        lines.push("COMMENT             " + comment);
      });
    }
    if (serSeq.teselagen_unique_id) {
      lines.push(
        "COMMENT             teselagen_unique_id: " + serSeq.teselagen_unique_id
      );
    }
    if (serSeq.library) {
      lines.push("COMMENT             library: " + serSeq.library);
    }
    serSeq.features = map(serSeq.features).concat(
      map(serSeq.parts, p => {
        p.notes = {
          ...p.notes,
          pragma: ["Teselagen_Part"]
        };
        return p;
      })
    );
    var printedFeatureHeader;
    each(serSeq.features, function(feat, index) {
      if (!printedFeatureHeader) {
        printedFeatureHeader = true;
        lines.push("FEATURES             Location/Qualifiers");
      }
      lines.push(featureToGenbankString(feat, options));
    });

    lines.push("ORIGIN      ");
    for (var i = 0; i < serSeq.sequence.length; i = i + 60) {
      var line = [];
      var ind = StringUtil.lpad("" + (i + 1), " ", 9);
      line.push(ind);

      for (var j = i; j < i + 60; j = j + 10) {
        // line.push(serSeq.sequence.slice(j,j+10).join(''));
        line.push(cutUp(serSeq.sequence, j, j + 10));
      }
      lines.push(line.join(" "));
    }

    lines.push("//");

    content = lines.join("\r\n");
    // return cb(err, content);
    return content;
  } catch (e) {
    console.warn("Error processing sequence << Check jsonToGenbank.js");
    console.warn(serSeq);
    console.warn(e.stack);
    return false;
  }
};

function createGenbankLocus(serSeq, options) {
  if (serSeq.sequence.symbols) {
    serSeq.sequence = serSeq.sequence.symbols.split("");
  }

  var tmp;
  var dnaType;
  if (serSeq.isProtein) {
    dnaType = "";
  } else if (serSeq.type === "RNA") {
    dnaType = "RNA";
  } else {
    dnaType = "DNA";
  }
  var date = getCurrentDateString();

  var line = StringUtil.rpad("LOCUS", " ", 12);
  var nameToUse = serSeq.name || "Untitled_Sequence";
  nameToUse = options.reformatSeqName
    ? nameUtils.reformatName(nameToUse)
    : nameToUse;
  line += StringUtil.rpad(nameToUse, " ", 16);
  line += " "; // T.H line 2778 of GenbankFormat.as col 29 space
  line += StringUtil.lpad(String(serSeq.sequence.length), " ", 11);
  line += serSeq.isProtein ? " aa " : " bp "; // col 41
  // if (strandType !== "") {
  // 	tmp =  strandType + "-";
  // } else {
  tmp = "";
  // }
  line += StringUtil.lpad(tmp, " ", 3);
  line += StringUtil.rpad(dnaType, " ", 6);
  line += "  ";

  if (!serSeq.circular || serSeq.circular === "0") {
    line += "linear  ";
    //line += "        ";
  } else {
    line += "circular";
  }

  line += " "; //col 64
  // if (divisionCode !== undefined) {
  // 	line += StringUtil.rpad(divisionCode," ", 3);
  // } else {
  StringUtil.rpad(line, " ", 3);
  // }
  line += " "; // col 68
  // DOES NOT PARSE DATE USEFULLY ORIGINALLY!
  line += date;
  //line += "\n";

  return line;
}

function getCurrentDateString() {
  var date = new Date();
  date = date.toString().split(" ");
  var day = date[2];
  var month = date[1].toUpperCase();
  var year = date[3];
  return day + "-" + month + "-" + year;
}

function featureNoteInDataToGenbankString(name, value) {
  return StringUtil.lpad("/", " ", 22) + name + '="' + value + '"';
}

function featureToGenbankString(feat, options) {
  var lines = [];

  var line = "     " + StringUtil.rpad(feat.type || "misc_feature", " ", 16);
  var locStr = "";

  //for(var i=0;i<feat.locations.length;i++) {
  //	var loc = feat.locations[i];
  //	locStr.push((loc.start+1) + '..' + loc.end);
  //}

  if (feat.locations && feat.locations.length > 1) {
    feat.locations.forEach((loc, i) => {
      locStr +=
        getProteinStart(
          parseInt(loc.start, 10) + (options.inclusive1BasedStart ? 0 : 1),
          options.isProtein
        ) +
        ".." +
        getProteinEnd(
          parseInt(loc.end, 10) + (options.inclusive1BasedEnd ? 0 : 1),
          options.isProtein
        );

      if (i !== feat.locations.length - 1) {
        locStr += ",";
      }
    });
    locStr = "join(" + locStr + ")";
  } else {
    locStr +=
      getProteinStart(
        parseInt(feat.start, 10) + (options.inclusive1BasedStart ? 0 : 1),
        options.isProtein
      ) +
      ".." +
      getProteinEnd(
        parseInt(feat.end, 10) + (options.inclusive1BasedEnd ? 0 : 1),
        options.isProtein
      );
  }

  // locStr = locStr.join(",");

  if (feat.strand === -1) {
    locStr = "complement(" + locStr + ")";
  }

  lines.push(line + locStr);

  lines.push(
    featureNoteInDataToGenbankString("label", feat.name || "Untitled Feature")
  );

  var notes = feat.notes;
  if (notes) {
    try {
      if (typeof notes === "string") {
        try {
          notes = JSON.parse(notes);
        } catch (e) {
          console.warn("Warning: Note incorrectly sent as a string.");
          notes = {}; //set the notes to a blank object
        }
      }
      Object.keys(notes).forEach(function(key) {
        if (notes[key] instanceof Array) {
          notes[key].forEach(function(value) {
            lines.push(featureNoteInDataToGenbankString(key, value));
          });
        } else {
          console.warn("Warning: Note object expected array values");
          console.warn(notes);
        }
      });
    } catch (e) {
      console.warn("Warning: Note cannot be processed");
    }
  }

  return lines.join("\r\n");
}

function getProteinStart(val, isProtein) {
  if (!isProtein) return val;
  return Math.floor((val + 2) / 3);
}
function getProteinEnd(val, isProtein) {
  if (!isProtein) return val;
  return Math.floor((val) / 3);
}
