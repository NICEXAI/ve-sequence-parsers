import sbolXmlToJson from "../parsers/sbolXmlToJson";
import path from "path";
import fs from "fs";
import chai from "chai";
chai.use(require("chai-things"));
chai.should();

describe("sbolXmlToJson", function() {
  it("should parse b12 sbol xml file to our json representation correctly", async function() {
    const string = fs.readFileSync(
      path.join(__dirname, "./testData/sbol/b12.xml"),
      "utf8"
    );
    /*
        Note: This is my take on how the JSON of how the example file in SBOL 2.3 specification p.132
        B.1.2 Serializing ComponentDefinition Object should looks like

        {
          "size": 35,
          "sequence": "ttgacagctagctcagtcctaggtataatgctagcc",
          "circular": false,
          "name": "J23119 promoter",
          "description": "Constitutive promoter",
          "features": [
              {
                  "name": "BBa_J23119",
                  "type": "Promoter",
                  "id": "unique_id",
                  "start": 1,
                  "end": 35,
                  "strand": 1,
                  "notes": "{\"role\":\"http://identifiers.org/so/SO:0000167",\"role\":\"resource="http://identifiers.org/so/SO:0000613"}",

              },
          ],
      }
     */
    const result = await sbolXmlToJson(string);
    result[0].parsedSequence.name.should.equal("J23119 promoter"); // (p.18 SBol2.3)
    result[0].parsedSequence.description.should.equal("Constitutive promoter");
    result[0].parsedSequence.circular.should.equal(false);
    result[0].parsedSequence.sequence.should.equal("ttgacagctagctcagtcctaggtataatgctagcc");
    result[0].parsedSequence.size.should.equal(36); // sequence.length
    result[0].parsedSequence.features[0].type.should.equal('Promoter'); // (p.24 Sbol 2.3)
  });
  it("should parse an sbol xml file to our json representation correctly", async function() {
    const string = fs.readFileSync(
      path.join(__dirname, "./testData/pBbE0c-RFP.xml"),
      "utf8"
    );
    const result = await sbolXmlToJson(string);
    result[0].parsedSequence.name.should.equal("pBbE0c-RFP");
    result[0].parsedSequence.circular.should.equal(false);
    result[0].parsedSequence.extraLines.length.should.equal(0);
    result[0].parsedSequence.features.length.should.equal(4);
    result[0].parsedSequence.features.should.include.something.that.deep.equals(
      {
        notes: {
          "ns2:about": [
            "public-registry.jbei.org/entry/dc#18302dcf-fae9-40c8-a37a-f0e45dd77a64",
            "public-registry.jbei.org/entry/sa#ae7eb7e3-be41-4a14-a50d-818de29f9378",
          ],
          "ns2:resource": ["http://purl.obolibrary.org/obo/SO_0000296"],
        },
        name: "colE1 origin",
        start: 1201,
        end: 1883,
        strand: 1,
        type: "misc_feature",
      }
    );
    result[0].parsedSequence.sequence.length.should.equal(2815);
  });
  it("should return an error (not throw an error) when trying to parse a genbank string", async function() {
    const string = fs.readFileSync(
      path.join(__dirname, "./testData/genbank/genbankThatBrokeSbolImport.gb"),
      "utf8"
    );
    const results = await sbolXmlToJson(string);
    results[0].success.should.equal(false);
    results[0].messages[0].should.equal(
      "SBOL-PARSER: Error parsing XML to JSON"
    );
  });
});

// describe('test of sbol from SBOL site', function () {
//     it('tests the parsing of toggle switches', function () {
//         var string = fs.readFileSync(path.join(__dirname, './testData/Sbol Website/pIKE_pTAK_toggle_switches.xml'), "utf8");
//         (string, function(result){
//         });
//     });
// });
// var string = fs.readFileSync(path.join(__dirname, '../../../..', 'testing/sequence_data/sbol/jbei-seq.xml'), "utf8");
// (string, function (result) {
//     assert.equal(result[0].parsedSequence.name, 'signal_pep');
//     assert.equal(result[0].parsedSequence.circular, false);
//     assert.equal(result[0].parsedSequence.extraLines, null);
//     assert.equal(result[0].parsedSequence.features.length, 1);
//     assert(result[0].parsedSequence.features.filter(function(feature) {
//         //tnrtodo: add testing of note's parsing
//         //and add more features, not just 1
//         if (feature.name === 'signal_peptide' && feature.start === 0 && feature.end === 63 && feature.type === 'CDS' && feature.strand === 1) {
//             return true;
//         }
//     }).length);
//     // assert.equal(result[0].parsedSequence.sequence.length, 81);
// });
//
// var string = fs.readFileSync(path.join(__dirname, '../../../..', 'testing/sequence_data/sbol/sbol_example.xml'), "utf8");
// (string, function (result) {
//     assert.equal(result[0].parsedSequence.name, 'pBbS8c-RFP');
//     assert.equal(result[0].parsedSequence.circular, false);
//     assert.equal(result[0].parsedSequence.extraLines, null);
//     assert.equal(result[0].parsedSequence.features.length, 13);
//     assert(result[0].parsedSequence.features.filter(function(feature) {
//         //tnrtodo: add testing of note's parsing
//         //and add more features, not just 1
//         if (feature.name === 'pBAD\\promoter' && feature.start === 1160 && feature.end === 1187 && feature.type === 'misc_feature' && feature.strand === 1) { //there is a little bit of weirdness here with the xml2js conversion adding an extra \ character
//             return true;
//         }
//     }).length);
//     assert.equal(result[0].parsedSequence.sequence.length, 5213);
// });
//
// var string = fs.readFileSync(path.join(__dirname, '../../../..', 'testing/sequence_data/sbol/sbol_example.xml'), "utf8");
// (string, function (result) {
//     assert.equal(result[0].parsedSequence.name, 'pBbS8c-RFP');
//     assert.equal(result[0].parsedSequence.circular, false);
//     assert.equal(result[0].parsedSequence.extraLines, null);
//     assert.equal(result[0].parsedSequence.features.length, 13);
//     assert(result[0].parsedSequence.features.filter(function(feature) {
//         //tnrtodo: add testing of note's parsing
//         //and add more features, not just 1
//         if (feature.name === 'pBAD\\promoter' && feature.start === 1160 && feature.end === 1187 && feature.type === 'misc_feature' && feature.strand === 1) { //there is a little bit of weirdness here with the xml2js conversion adding an extra \ character
//             return true;
//         }
//     }).length);
//     assert.equal(result[0].parsedSequence.sequence.length, 5213);
// });
