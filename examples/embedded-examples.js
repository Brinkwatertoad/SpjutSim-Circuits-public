/* Auto-generated from examples/*.json for file:// fallback. */
(function initEmbeddedExamples() {
  self.SpjutSimEmbeddedExamples = {
  "generatedAt": "2026-03-10T04:31:32.114Z",
  "documents": [
    {
      "file": "dc.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "DC: Divider Sweep",
        "createdAt": "2026-02-11T00:00:00.000Z",
        "updatedAt": "2026-02-11T00:00:00.000Z",
        "schematic": {
          "components": [
            {
              "id": "V1",
              "type": "V",
              "value": "0",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 40,
                  "y": 40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 40,
                  "y": 80
                }
              ]
            },
            {
              "id": "R1",
              "type": "R",
              "value": "10k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 80,
                  "y": 40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 120,
                  "y": 40
                }
              ]
            },
            {
              "id": "R2",
              "type": "R",
              "value": "10k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 140,
                  "y": 40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 140,
                  "y": 80
                }
              ]
            },
            {
              "id": "GND1",
              "type": "GND",
              "value": "",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 140,
                  "y": 120
                }
              ]
            }
          ],
          "wires": [
            {
              "id": "W_IN",
              "points": [
                {
                  "x": 40,
                  "y": 40
                },
                {
                  "x": 80,
                  "y": 40
                }
              ]
            },
            {
              "id": "W_R1_TO_NODE",
              "points": [
                {
                  "x": 120,
                  "y": 40
                },
                {
                  "x": 140,
                  "y": 40
                }
              ]
            },
            {
              "id": "W_NODE_GND",
              "points": [
                {
                  "x": 140,
                  "y": 80
                },
                {
                  "x": 140,
                  "y": 120
                }
              ]
            },
            {
              "id": "W_V1_GND",
              "points": [
                {
                  "x": 40,
                  "y": 80
                },
                {
                  "x": 40,
                  "y": 120
                },
                {
                  "x": 140,
                  "y": 120
                }
              ]
            }
          ]
        },
        "editor": {
          "view": null,
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 20,
            "snap": true,
            "visible": true
          }
        },
        "simulation": {
          "config": {
            "activeKind": "dc",
            "op": {},
            "dc": {
              "source": "V1",
              "start": "0",
              "stop": "10",
              "step": "1"
            },
            "tran": {
              "source": "V1",
              "sourceMode": "pulse",
              "sourceValue": "pulse(0 5 1m 1u 1u 5m 10m)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "1",
              "sineFreq": "1k",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "10m",
              "step": "0.1m",
              "maxStep": ""
            },
            "ac": {
              "source": "V1",
              "sourceValue": "",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": [
                "all"
              ]
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": false
          }
        }
      }
    },
    {
      "file": "Full-wave_Rectifier.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "",
        "createdAt": "2026-03-08T05:36:41.449Z",
        "updatedAt": "2026-03-10T04:31:18.993Z",
        "schematic": {
          "components": [
            {
              "id": "XFMR4",
              "name": "XFMR1",
              "type": "XFMR",
              "value": "1.41421356237",
              "netColor": "#8a151b",
              "xfmrLp": "1m",
              "xfmrSolveBy": "secondary",
              "xfmrLs": "1.99999999999m",
              "xfmrK": "1",
              "xfmrRpri": "1m",
              "xfmrRsec": "1m",
              "xfmrPolarity": "subtractive",
              "rotation": 0,
              "pins": [
                {
                  "id": "P1",
                  "name": "P1",
                  "x": 460,
                  "y": 130
                },
                {
                  "id": "P2",
                  "name": "P2",
                  "x": 460,
                  "y": 170
                },
                {
                  "id": "S1",
                  "name": "S1",
                  "x": 500,
                  "y": 130
                },
                {
                  "id": "S2",
                  "name": "S2",
                  "x": 500,
                  "y": 170
                }
              ]
            },
            {
              "id": "GND1",
              "name": "GND1",
              "type": "GND",
              "value": "",
              "netColor": "#8a151b",
              "groundVariant": "earth",
              "rotation": 0,
              "pins": [
                {
                  "id": "0",
                  "name": "0",
                  "x": 440,
                  "y": 180
                }
              ]
            },
            {
              "id": "GND2",
              "name": "GND2",
              "type": "GND",
              "value": "",
              "netColor": "#8a151b",
              "groundVariant": "earth",
              "rotation": 0,
              "pins": [
                {
                  "id": "0",
                  "name": "0",
                  "x": 590,
                  "y": 210
                }
              ]
            },
            {
              "id": "D6",
              "name": "D1",
              "type": "D",
              "value": "1N4148",
              "netColor": "#8a151b",
              "diodeDisplayType": "default",
              "diodePreset": "1N4148",
              "diodeIS": "35p",
              "diodeN": "1.24",
              "diodeRS": "64m",
              "diodeTT": "5.0n",
              "diodeCJO": "4.0p",
              "diodeVJ": "0.6",
              "diodeM": "0.285",
              "diodeFC": "",
              "diodeEG": "",
              "diodeXTI": "",
              "diodeTNOM": "",
              "diodeBV": "75",
              "diodeIBV": "",
              "diodeExtra": "",
              "diodeArea": "",
              "diodeTEMP": "",
              "diodeDTEMP": "",
              "diodeIC": "",
              "rotation": 0,
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 560,
                  "y": 60
                },
                {
                  "id": "K",
                  "name": "K",
                  "x": 600,
                  "y": 60
                }
              ]
            },
            {
              "id": "D8",
              "name": "D2",
              "type": "D",
              "value": "1N4148",
              "netColor": "#8a151b",
              "diodeDisplayType": "default",
              "diodePreset": "1N4148",
              "diodeIS": "35p",
              "diodeN": "1.24",
              "diodeRS": "64m",
              "diodeTT": "5.0n",
              "diodeCJO": "4.0p",
              "diodeVJ": "0.6",
              "diodeM": "0.285",
              "diodeFC": "",
              "diodeEG": "",
              "diodeXTI": "",
              "diodeTNOM": "",
              "diodeBV": "75",
              "diodeIBV": "",
              "diodeExtra": "",
              "diodeArea": "",
              "diodeTEMP": "",
              "diodeDTEMP": "",
              "diodeIC": "",
              "rotation": 0,
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 620,
                  "y": 60
                },
                {
                  "id": "K",
                  "name": "K",
                  "x": 660,
                  "y": 60
                }
              ]
            },
            {
              "id": "D9",
              "name": "D4",
              "type": "D",
              "value": "1N4148",
              "netColor": "#8a151b",
              "diodeDisplayType": "default",
              "diodePreset": "1N4148",
              "diodeIS": "35p",
              "diodeN": "1.24",
              "diodeRS": "64m",
              "diodeTT": "5.0n",
              "diodeCJO": "4.0p",
              "diodeVJ": "0.6",
              "diodeM": "0.285",
              "diodeFC": "",
              "diodeEG": "",
              "diodeXTI": "",
              "diodeTNOM": "",
              "diodeBV": "75",
              "diodeIBV": "",
              "diodeExtra": "",
              "diodeArea": "",
              "diodeTEMP": "",
              "diodeDTEMP": "",
              "diodeIC": "",
              "rotation": 0,
              "labelRotation": 180,
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 620,
                  "y": 110
                },
                {
                  "id": "K",
                  "name": "K",
                  "x": 660,
                  "y": 110
                }
              ]
            },
            {
              "id": "D10",
              "name": "D3",
              "type": "D",
              "value": "1N4148",
              "netColor": "#8a151b",
              "diodeDisplayType": "default",
              "diodePreset": "1N4148",
              "diodeIS": "35p",
              "diodeN": "1.24",
              "diodeRS": "64m",
              "diodeTT": "5.0n",
              "diodeCJO": "4.0p",
              "diodeVJ": "0.6",
              "diodeM": "0.285",
              "diodeFC": "",
              "diodeEG": "",
              "diodeXTI": "",
              "diodeTNOM": "",
              "diodeBV": "75",
              "diodeIBV": "",
              "diodeExtra": "",
              "diodeArea": "",
              "diodeTEMP": "",
              "diodeDTEMP": "",
              "diodeIC": "",
              "rotation": 0,
              "labelRotation": 180,
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 560,
                  "y": 110
                },
                {
                  "id": "K",
                  "name": "K",
                  "x": 600,
                  "y": 110
                }
              ]
            },
            {
              "id": "R3",
              "name": "R1",
              "type": "R",
              "value": "5k",
              "netColor": "#8a151b",
              "resistorStyle": "zigzag",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 730,
                  "y": 130
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 730,
                  "y": 170
                }
              ]
            },
            {
              "id": "C3",
              "name": "C1",
              "type": "C",
              "value": "1n",
              "netColor": "#8a151b",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 680,
                  "y": 130
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 680,
                  "y": 170
                }
              ]
            },
            {
              "id": "VAC2",
              "name": "VAC2",
              "type": "VAC",
              "value": "",
              "netColor": "#8a151b",
              "vacAmplitude": "10",
              "vacFrequency": "50",
              "vacPhase": "0",
              "vacDcOffset": "0",
              "vacWaveform": "sine",
              "rotation": 0,
              "labelRotation": 180,
              "pins": [
                {
                  "id": "+",
                  "name": "+",
                  "x": 400,
                  "y": 130
                },
                {
                  "id": "-",
                  "name": "-",
                  "x": 400,
                  "y": 170
                }
              ]
            }
          ],
          "wires": [
            {
              "id": "W154",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 460,
                  "y": 170
                },
                {
                  "x": 440,
                  "y": 170
                }
              ]
            },
            {
              "id": "W193",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 440,
                  "y": 170
                },
                {
                  "x": 440,
                  "y": 180
                }
              ]
            },
            {
              "id": "W157",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 620,
                  "y": 110
                },
                {
                  "x": 610,
                  "y": 110
                }
              ]
            },
            {
              "id": "W183",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 610,
                  "y": 110
                },
                {
                  "x": 600,
                  "y": 110
                }
              ]
            },
            {
              "id": "W182",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 610,
                  "y": 110
                },
                {
                  "x": 610,
                  "y": 170
                },
                {
                  "x": 500,
                  "y": 170
                }
              ]
            },
            {
              "id": "W158",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 620,
                  "y": 60
                },
                {
                  "x": 610,
                  "y": 60
                }
              ]
            },
            {
              "id": "W181",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 610,
                  "y": 60
                },
                {
                  "x": 600,
                  "y": 60
                }
              ]
            },
            {
              "id": "W180",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 610,
                  "y": 60
                },
                {
                  "x": 610,
                  "y": 20
                },
                {
                  "x": 520,
                  "y": 20
                },
                {
                  "x": 520,
                  "y": 130
                },
                {
                  "x": 500,
                  "y": 130
                }
              ]
            },
            {
              "id": "W159",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 560,
                  "y": 60
                },
                {
                  "x": 540,
                  "y": 60
                },
                {
                  "x": 540,
                  "y": 110
                }
              ]
            },
            {
              "id": "W164",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 540,
                  "y": 110
                },
                {
                  "x": 560,
                  "y": 110
                }
              ]
            },
            {
              "id": "W163",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 540,
                  "y": 110
                },
                {
                  "x": 540,
                  "y": 200
                },
                {
                  "x": 590,
                  "y": 200
                }
              ]
            },
            {
              "id": "W201",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 590,
                  "y": 200
                },
                {
                  "x": 680,
                  "y": 200
                }
              ]
            },
            {
              "id": "W197",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 680,
                  "y": 200
                },
                {
                  "x": 730,
                  "y": 200
                },
                {
                  "x": 730,
                  "y": 170
                }
              ]
            },
            {
              "id": "W160",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 660,
                  "y": 60
                },
                {
                  "x": 660,
                  "y": 90
                }
              ]
            },
            {
              "id": "W179",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 660,
                  "y": 110
                },
                {
                  "x": 660,
                  "y": 90
                }
              ]
            },
            {
              "id": "W186",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 660,
                  "y": 90
                },
                {
                  "x": 680,
                  "y": 90
                }
              ]
            },
            {
              "id": "W185",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 680,
                  "y": 90
                },
                {
                  "x": 680,
                  "y": 130
                }
              ]
            },
            {
              "id": "W171",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 680,
                  "y": 90
                },
                {
                  "x": 730,
                  "y": 90
                },
                {
                  "x": 730,
                  "y": 130
                }
              ]
            },
            {
              "id": "W172",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 680,
                  "y": 170
                },
                {
                  "x": 680,
                  "y": 200
                }
              ]
            },
            {
              "id": "W192",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 400,
                  "y": 170
                },
                {
                  "x": 440,
                  "y": 170
                }
              ]
            },
            {
              "id": "W198",
              "netColor": "#24a148",
              "points": [
                {
                  "x": 400,
                  "y": 130
                },
                {
                  "x": 460,
                  "y": 130
                }
              ]
            },
            {
              "id": "W200",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 590,
                  "y": 200
                },
                {
                  "x": 590,
                  "y": 210
                }
              ]
            }
          ]
        },
        "editor": {
          "view": {
            "x": 270.62940560438255,
            "y": -140.0386303839712,
            "width": 600.2810000000002,
            "height": 596.367549494309
          },
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 10,
            "snap": true,
            "visible": false
          }
        },
        "simulation": {
          "config": {
            "activeKind": "tran",
            "op": {},
            "dc": {
              "source": "VAC2",
              "start": "0",
              "stop": "10",
              "step": "1"
            },
            "tran": {
              "source": "VAC2",
              "sourceMode": "sine",
              "sourceValue": "sin(0 10 50)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "10",
              "sineFreq": "50",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "50m",
              "step": "0.01m",
              "maxStep": ""
            },
            "ac": {
              "source": "VAC2",
              "sourceValue": "ac 1",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": []
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": false
          },
          "resultsPane": {
            "mode": "split",
            "splitRatio": 0.5439301408371114
          },
          "settings": {
            "autoSwitchToSelectOnPlace": true,
            "autoSwitchToSelectOnWire": false,
            "includeSchematicValueUnitSpace": true,
            "schematicText": {
              "font": "Segoe UI",
              "size": 12,
              "bold": false,
              "italic": false
            },
            "componentDefaults": {
              "R": {
                "value": "1k",
                "netColor": null
              },
              "C": {
                "value": "1u",
                "netColor": null
              },
              "L": {
                "value": "1m",
                "netColor": null
              },
              "XFMR": {
                "value": "1",
                "netColor": null,
                "xfmrPolarity": "subtractive",
                "xfmrSolveBy": "ratio"
              },
              "V": {
                "value": "1",
                "netColor": null
              },
              "VAC": {
                "value": "",
                "netColor": null,
                "vacAmplitude": "1",
                "vacFrequency": "1k",
                "vacWaveform": "sine"
              },
              "I": {
                "value": "1",
                "netColor": null
              },
              "VM": {
                "value": "",
                "netColor": null
              },
              "AM": {
                "value": "",
                "netColor": null
              },
              "SW": {
                "value": "",
                "netColor": null
              },
              "SPST": {
                "value": "",
                "netColor": null
              },
              "D": {
                "value": "1N4148",
                "netColor": null
              },
              "NET": {
                "value": "",
                "netColor": null
              },
              "TEXT": {
                "value": "",
                "netColor": null
              },
              "ARR": {
                "value": "",
                "netColor": null
              },
              "BOX": {
                "value": "",
                "netColor": null
              }
            },
            "toolDisplayDefaults": {
              "resistorStyle": "zigzag",
              "groundVariant": "earth",
              "groundColor": null,
              "probeColor": null
            },
            "wireDefaultColor": "#139c9c"
          }
        }
      }
    },
    {
      "file": "Half-wave_Rectifier.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "",
        "createdAt": "2026-03-08T05:36:41.449Z",
        "updatedAt": "2026-03-10T04:19:38.140Z",
        "schematic": {
          "components": [
            {
              "id": "D1",
              "name": "D1",
              "type": "D",
              "value": "10A04",
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 290,
                  "y": 170
                },
                {
                  "id": "K",
                  "name": "K",
                  "x": 330,
                  "y": 170
                }
              ],
              "rotation": 0,
              "netColor": "#8a151b",
              "diodeDisplayType": "default",
              "diodePreset": "10A04",
              "diodeIS": "844n",
              "diodeN": "2.06",
              "diodeRS": "2.06m",
              "diodeTT": "4.32u",
              "diodeCJO": "277p",
              "diodeVJ": "0.6",
              "diodeM": "0.333",
              "diodeFC": "",
              "diodeEG": "",
              "diodeXTI": "",
              "diodeTNOM": "",
              "diodeBV": "400",
              "diodeIBV": "10u",
              "diodeExtra": "",
              "diodeArea": "",
              "diodeTEMP": "",
              "diodeDTEMP": "",
              "diodeIC": ""
            },
            {
              "id": "R1",
              "name": "R1",
              "type": "R",
              "value": "1.5k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 400,
                  "y": 190
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 400,
                  "y": 230
                }
              ],
              "resistorStyle": "zigzag",
              "netColor": "#8a151b"
            },
            {
              "id": "GND1",
              "name": "GND1",
              "type": "GND",
              "value": "",
              "pins": [
                {
                  "id": "0",
                  "name": "0",
                  "x": 330,
                  "y": 260
                }
              ],
              "rotation": 0,
              "groundVariant": "earth",
              "netColor": "#8a151b"
            },
            {
              "id": "PV1",
              "name": "V(N1)",
              "type": "PV",
              "value": "",
              "pins": [
                {
                  "id": "P",
                  "name": "P",
                  "x": 370,
                  "y": 170
                }
              ],
              "rotation": 0,
              "netColor": "#da1e28"
            },
            {
              "id": "PV2",
              "name": "V(N2)",
              "type": "PV",
              "value": "",
              "pins": [
                {
                  "id": "P",
                  "name": "P",
                  "x": 260,
                  "y": 170
                }
              ],
              "rotation": 270,
              "netColor": "#da1e28"
            },
            {
              "id": "VAC1",
              "name": "VAC1",
              "type": "VAC",
              "value": "",
              "pins": [
                {
                  "id": "+",
                  "name": "+",
                  "x": 230,
                  "y": 190
                },
                {
                  "id": "-",
                  "name": "-",
                  "x": 230,
                  "y": 230
                }
              ],
              "rotation": 0,
              "vacAmplitude": "1",
              "vacFrequency": "1k",
              "vacPhase": "0",
              "vacDcOffset": "0",
              "vacWaveform": "sine",
              "netColor": "#8a151b"
            },
            {
              "id": "C1",
              "name": "C1",
              "type": "C",
              "value": "1p",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 350,
                  "y": 190
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 350,
                  "y": 230
                }
              ],
              "rotation": 0,
              "netColor": "#8a151b"
            },
            {
              "id": "TEXT2",
              "name": "Try increasing the capacitance!",
              "type": "TEXT",
              "value": "",
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 230,
                  "y": 90
                }
              ],
              "rotation": 0,
              "textFont": "Segoe UI",
              "textSize": 14
            }
          ],
          "wires": [
            {
              "id": "W93",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 330,
                  "y": 170
                },
                {
                  "x": 350,
                  "y": 170
                }
              ]
            },
            {
              "id": "W102",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 350,
                  "y": 170
                },
                {
                  "x": 400,
                  "y": 170
                },
                {
                  "x": 400,
                  "y": 190
                }
              ]
            },
            {
              "id": "W97",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 400,
                  "y": 230
                },
                {
                  "x": 400,
                  "y": 250
                },
                {
                  "x": 350,
                  "y": 250
                }
              ]
            },
            {
              "id": "W105",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 350,
                  "y": 250
                },
                {
                  "x": 350,
                  "y": 230
                }
              ]
            },
            {
              "id": "W104",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 350,
                  "y": 250
                },
                {
                  "x": 330,
                  "y": 250
                }
              ]
            },
            {
              "id": "W106",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 330,
                  "y": 250
                },
                {
                  "x": 230,
                  "y": 250
                },
                {
                  "x": 230,
                  "y": 230
                }
              ]
            },
            {
              "id": "W100",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 330,
                  "y": 250
                },
                {
                  "x": 330,
                  "y": 260
                }
              ]
            },
            {
              "id": "W98",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 230,
                  "y": 190
                },
                {
                  "x": 230,
                  "y": 170
                },
                {
                  "x": 290,
                  "y": 170
                }
              ]
            },
            {
              "id": "W101",
              "netColor": "#139c9c",
              "points": [
                {
                  "x": 350,
                  "y": 190
                },
                {
                  "x": 350,
                  "y": 170
                }
              ]
            }
          ]
        },
        "editor": {
          "view": {
            "x": 176.50997321813526,
            "y": -1.0042067897448117,
            "width": 342.8570365691398,
            "height": 402.9022144164228
          },
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 10,
            "snap": true,
            "visible": false
          }
        },
        "simulation": {
          "config": {
            "activeKind": "tran",
            "op": {},
            "dc": {
              "source": "VAC1",
              "start": "0",
              "stop": "10",
              "step": "1"
            },
            "tran": {
              "source": "VAC1",
              "sourceMode": "sine",
              "sourceValue": "sin(0 1 1k)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "1",
              "sineFreq": "1k",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "3m",
              "step": "0.001m",
              "maxStep": ""
            },
            "ac": {
              "source": "VAC1",
              "sourceValue": "",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": []
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": false
          },
          "resultsPane": {
            "mode": "split",
            "splitRatio": 0.5439301408371114
          },
          "settings": {
            "autoSwitchToSelectOnPlace": true,
            "autoSwitchToSelectOnWire": false,
            "includeSchematicValueUnitSpace": true,
            "schematicText": {
              "font": "Segoe UI",
              "size": 12,
              "bold": false,
              "italic": false
            },
            "componentDefaults": {
              "R": {
                "value": "1k",
                "netColor": "#8a151b"
              },
              "C": {
                "value": "1u",
                "netColor": "#8a151b"
              },
              "L": {
                "value": "1m",
                "netColor": "#8a151b"
              },
              "XFMR": {
                "value": "1",
                "netColor": "#8a151b",
                "xfmrPolarity": "subtractive",
                "xfmrSolveBy": "ratio"
              },
              "V": {
                "value": "1",
                "netColor": "#8a151b"
              },
              "VAC": {
                "value": "",
                "netColor": "#8a151b",
                "vacAmplitude": "1",
                "vacFrequency": "1k",
                "vacWaveform": "sine"
              },
              "I": {
                "value": "1",
                "netColor": "#8a151b"
              },
              "VM": {
                "value": "",
                "netColor": "#8a151b"
              },
              "AM": {
                "value": "",
                "netColor": "#8a151b"
              },
              "SW": {
                "value": "",
                "netColor": "#8a151b"
              },
              "SPST": {
                "value": "",
                "netColor": "#8a151b"
              },
              "D": {
                "value": "1N5711",
                "netColor": "#8a151b"
              },
              "NET": {
                "value": "",
                "netColor": null
              },
              "TEXT": {
                "value": "",
                "netColor": null
              },
              "ARR": {
                "value": "",
                "netColor": null
              },
              "BOX": {
                "value": "",
                "netColor": null
              }
            },
            "toolDisplayDefaults": {
              "resistorStyle": "zigzag",
              "groundVariant": "earth",
              "groundColor": "#8a151b",
              "probeColor": "#da1e28"
            },
            "wireDefaultColor": "#139c9c"
          }
        }
      }
    },
    {
      "file": "op.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "OP: Voltage Divider",
        "createdAt": "2026-02-11T00:00:00.000Z",
        "updatedAt": "2026-02-11T00:00:00.000Z",
        "schematic": {
          "components": [
            {
              "id": "V1",
              "type": "V",
              "value": "10",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 40,
                  "y": 40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 40,
                  "y": 80
                }
              ]
            },
            {
              "id": "R1",
              "type": "R",
              "value": "10k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 80,
                  "y": 40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 120,
                  "y": 40
                }
              ]
            },
            {
              "id": "R2",
              "type": "R",
              "value": "10k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 140,
                  "y": 40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 140,
                  "y": 80
                }
              ]
            },
            {
              "id": "GND1",
              "type": "GND",
              "value": "",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 140,
                  "y": 120
                }
              ]
            }
          ],
          "wires": [
            {
              "id": "W_IN",
              "points": [
                {
                  "x": 40,
                  "y": 40
                },
                {
                  "x": 80,
                  "y": 40
                }
              ]
            },
            {
              "id": "W_R1_TO_NODE",
              "points": [
                {
                  "x": 120,
                  "y": 40
                },
                {
                  "x": 140,
                  "y": 40
                }
              ]
            },
            {
              "id": "W_NODE_GND",
              "points": [
                {
                  "x": 140,
                  "y": 80
                },
                {
                  "x": 140,
                  "y": 120
                }
              ]
            },
            {
              "id": "W_V1_GND",
              "points": [
                {
                  "x": 40,
                  "y": 80
                },
                {
                  "x": 40,
                  "y": 120
                },
                {
                  "x": 140,
                  "y": 120
                }
              ]
            }
          ]
        },
        "editor": {
          "view": null,
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 20,
            "snap": true,
            "visible": true
          }
        },
        "simulation": {
          "config": {
            "activeKind": "op",
            "op": {},
            "dc": {
              "source": "V1",
              "start": "0",
              "stop": "10",
              "step": "1"
            },
            "tran": {
              "source": "V1",
              "sourceMode": "pulse",
              "sourceValue": "pulse(0 5 1m 1u 1u 5m 10m)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "1",
              "sineFreq": "1k",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "10m",
              "step": "0.1m",
              "maxStep": ""
            },
            "ac": {
              "source": "V1",
              "sourceValue": "",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": []
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": false
          }
        }
      }
    },
    {
      "file": "RC Series.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "",
        "createdAt": "2026-03-08T05:36:41.449Z",
        "updatedAt": "2026-03-10T04:24:15.158Z",
        "schematic": {
          "components": [
            {
              "id": "R1",
              "name": "R1",
              "type": "R",
              "value": "1k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 70,
                  "y": 40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 110,
                  "y": 40
                }
              ],
              "resistorStyle": "zigzag"
            },
            {
              "id": "C1",
              "name": "C1",
              "type": "C",
              "value": "1u",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 140,
                  "y": 50
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 140,
                  "y": 90
                }
              ]
            },
            {
              "id": "GND1",
              "name": "GND1",
              "type": "GND",
              "value": "",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 90,
                  "y": 130
                }
              ],
              "groundVariant": "earth"
            },
            {
              "id": "V2",
              "name": "V2",
              "type": "V",
              "value": "1",
              "pins": [
                {
                  "id": "+",
                  "name": "+",
                  "x": 40,
                  "y": 50
                },
                {
                  "id": "-",
                  "name": "-",
                  "x": 40,
                  "y": 90
                }
              ],
              "rotation": 0,
              "labelRotation": 180
            },
            {
              "id": "TEXT1",
              "name": "Try running Transient or AC",
              "type": "TEXT",
              "value": "",
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 20,
                  "y": -30
                }
              ],
              "rotation": 0,
              "textFont": "Segoe UI",
              "textSize": 14
            }
          ],
          "wires": [
            {
              "id": "W9",
              "points": [
                {
                  "x": 40,
                  "y": 50
                },
                {
                  "x": 40,
                  "y": 40
                },
                {
                  "x": 70,
                  "y": 40
                }
              ]
            },
            {
              "id": "W10",
              "points": [
                {
                  "x": 110,
                  "y": 40
                },
                {
                  "x": 140,
                  "y": 40
                },
                {
                  "x": 140,
                  "y": 50
                }
              ]
            },
            {
              "id": "W11",
              "points": [
                {
                  "x": 140,
                  "y": 90
                },
                {
                  "x": 140,
                  "y": 110
                },
                {
                  "x": 90,
                  "y": 110
                }
              ]
            },
            {
              "id": "W15",
              "points": [
                {
                  "x": 90,
                  "y": 110
                },
                {
                  "x": 40,
                  "y": 110
                },
                {
                  "x": 40,
                  "y": 90
                }
              ]
            },
            {
              "id": "W14",
              "points": [
                {
                  "x": 90,
                  "y": 110
                },
                {
                  "x": 90,
                  "y": 130
                }
              ]
            }
          ]
        },
        "editor": {
          "view": {
            "x": -81.42851828456992,
            "y": -116.4511072082114,
            "width": 342.85703656913984,
            "height": 402.9022144164228
          },
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 10,
            "snap": true,
            "visible": false
          }
        },
        "simulation": {
          "config": {
            "activeKind": "tran",
            "op": {},
            "dc": {
              "source": "V2",
              "start": "0",
              "stop": "10",
              "step": "1"
            },
            "tran": {
              "source": "V2",
              "sourceMode": "pulse",
              "sourceValue": "pulse(0 5 1m 1u 1u 5m 10m)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "1",
              "sineFreq": "1k",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "10m",
              "step": "0.1m",
              "maxStep": ""
            },
            "ac": {
              "source": "V2",
              "sourceValue": "ac 1",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": [
                "all"
              ]
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": false
          },
          "resultsPane": {
            "mode": "split",
            "splitRatio": 0.5439301408371114
          },
          "settings": {
            "autoSwitchToSelectOnPlace": true,
            "autoSwitchToSelectOnWire": false,
            "includeSchematicValueUnitSpace": true,
            "schematicText": {
              "font": "Segoe UI",
              "size": 12,
              "bold": false,
              "italic": false
            },
            "componentDefaults": {
              "R": {
                "value": "1k",
                "netColor": null
              },
              "C": {
                "value": "1u",
                "netColor": null
              },
              "L": {
                "value": "1m",
                "netColor": null
              },
              "XFMR": {
                "value": "1",
                "netColor": null,
                "xfmrPolarity": "subtractive",
                "xfmrSolveBy": "ratio"
              },
              "V": {
                "value": "1",
                "netColor": null
              },
              "VAC": {
                "value": "",
                "netColor": null,
                "vacAmplitude": "1",
                "vacFrequency": "1k",
                "vacWaveform": "sine"
              },
              "I": {
                "value": "1",
                "netColor": null
              },
              "VM": {
                "value": "",
                "netColor": null
              },
              "AM": {
                "value": "",
                "netColor": null
              },
              "SW": {
                "value": "",
                "netColor": null
              },
              "SPST": {
                "value": "",
                "netColor": null
              },
              "D": {
                "value": "1N4148",
                "netColor": null
              },
              "NET": {
                "value": "",
                "netColor": null
              },
              "TEXT": {
                "value": "",
                "netColor": null
              },
              "ARR": {
                "value": "",
                "netColor": null
              },
              "BOX": {
                "value": "",
                "netColor": null
              }
            },
            "toolDisplayDefaults": {
              "resistorStyle": "zigzag",
              "groundVariant": "earth",
              "groundColor": null,
              "probeColor": null
            },
            "wireDefaultColor": null
          }
        }
      }
    },
    {
      "file": "RL Series.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "",
        "createdAt": "2026-03-08T05:36:41.449Z",
        "updatedAt": "2026-03-10T04:25:21.018Z",
        "schematic": {
          "components": [
            {
              "id": "V1",
              "name": "V1",
              "type": "V",
              "value": "",
              "pins": [
                {
                  "id": "+",
                  "name": "+",
                  "x": 100,
                  "y": -10
                },
                {
                  "id": "-",
                  "name": "-",
                  "x": 100,
                  "y": 30
                }
              ],
              "rotation": 0
            },
            {
              "id": "R1",
              "name": "R1",
              "type": "R",
              "value": "100",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 130,
                  "y": -40
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 170,
                  "y": -40
                }
              ],
              "rotation": 0,
              "resistorStyle": "zigzag"
            },
            {
              "id": "L1",
              "name": "L1",
              "type": "L",
              "value": "10m",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 200,
                  "y": -10
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 200,
                  "y": 30
                }
              ],
              "rotation": 0
            },
            {
              "id": "GND1",
              "name": "GND1",
              "type": "GND",
              "value": "",
              "pins": [
                {
                  "id": "0",
                  "name": "0",
                  "x": 150,
                  "y": 60
                }
              ],
              "rotation": 0,
              "groundVariant": "earth"
            },
            {
              "id": "TEXT1",
              "name": "Try running Transient or AC",
              "type": "TEXT",
              "value": "",
              "pins": [
                {
                  "id": "A",
                  "name": "A",
                  "x": 80,
                  "y": -110
                }
              ],
              "rotation": 0,
              "textFont": "Segoe UI",
              "textSize": 14
            }
          ],
          "wires": [
            {
              "id": "W1",
              "points": [
                {
                  "x": 170,
                  "y": -40
                },
                {
                  "x": 200,
                  "y": -40
                },
                {
                  "x": 200,
                  "y": -10
                }
              ]
            },
            {
              "id": "W2",
              "points": [
                {
                  "x": 100,
                  "y": -10
                },
                {
                  "x": 100,
                  "y": -40
                },
                {
                  "x": 130,
                  "y": -40
                }
              ]
            },
            {
              "id": "W3",
              "points": [
                {
                  "x": 100,
                  "y": 30
                },
                {
                  "x": 100,
                  "y": 60
                },
                {
                  "x": 150,
                  "y": 60
                },
                {
                  "x": 200,
                  "y": 60
                },
                {
                  "x": 200,
                  "y": 30
                }
              ]
            }
          ]
        },
        "editor": {
          "view": {
            "x": -52.77305864243098,
            "y": -191.4511072082114,
            "width": 405.54611728486196,
            "height": 402.9022144164228
          },
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 10,
            "snap": true,
            "visible": false
          }
        },
        "simulation": {
          "config": {
            "activeKind": "tran",
            "op": {},
            "dc": {
              "source": "V1",
              "start": "0",
              "stop": "10",
              "step": "1"
            },
            "tran": {
              "source": "V1",
              "sourceMode": "pulse",
              "sourceValue": "pulse(0 5 1m 1u 1u 5m 10m)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "1",
              "sineFreq": "1k",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "10m",
              "step": "0.1m",
              "maxStep": ""
            },
            "ac": {
              "source": "V1",
              "sourceValue": "ac 1",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": [
                "all"
              ]
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": false
          },
          "resultsPane": {
            "mode": "split",
            "splitRatio": 0.5439301408371114
          },
          "settings": {
            "autoSwitchToSelectOnPlace": true,
            "autoSwitchToSelectOnWire": false,
            "includeSchematicValueUnitSpace": true,
            "schematicText": {
              "font": "Segoe UI",
              "size": 12,
              "bold": false,
              "italic": false
            },
            "componentDefaults": {
              "R": {
                "value": "1k",
                "netColor": null
              },
              "C": {
                "value": "1u",
                "netColor": null
              },
              "L": {
                "value": "1m",
                "netColor": null
              },
              "XFMR": {
                "value": "1",
                "netColor": null,
                "xfmrPolarity": "subtractive",
                "xfmrSolveBy": "ratio"
              },
              "V": {
                "value": "1",
                "netColor": null
              },
              "VAC": {
                "value": "",
                "netColor": null,
                "vacAmplitude": "1",
                "vacFrequency": "1k",
                "vacWaveform": "sine"
              },
              "I": {
                "value": "1",
                "netColor": null
              },
              "VM": {
                "value": "",
                "netColor": null
              },
              "AM": {
                "value": "",
                "netColor": null
              },
              "SW": {
                "value": "",
                "netColor": null
              },
              "SPST": {
                "value": "",
                "netColor": null
              },
              "D": {
                "value": "1N4148",
                "netColor": null
              },
              "NET": {
                "value": "",
                "netColor": null
              },
              "TEXT": {
                "value": "",
                "netColor": null
              },
              "ARR": {
                "value": "",
                "netColor": null
              },
              "BOX": {
                "value": "",
                "netColor": null
              }
            },
            "toolDisplayDefaults": {
              "resistorStyle": "zigzag",
              "groundVariant": "earth",
              "groundColor": null,
              "probeColor": null
            },
            "wireDefaultColor": null
          }
        }
      }
    },
    {
      "file": "Wire Simplify Demo 2.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "",
        "createdAt": "2026-03-08T19:03:14.624Z",
        "updatedAt": "2026-03-10T04:12:49.884Z",
        "schematic": {
          "components": [
            {
              "id": "V1",
              "name": "V1",
              "type": "V",
              "value": "12",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 40,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 40,
                  "y": 100
                }
              ]
            },
            {
              "id": "R1",
              "name": "R1",
              "type": "R",
              "value": "1k",
              "resistorStyle": "zigzag",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 80,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 120,
                  "y": 60
                }
              ]
            },
            {
              "id": "R2",
              "name": "R2",
              "type": "R",
              "value": "2k",
              "resistorStyle": "zigzag",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 160,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 200,
                  "y": 60
                }
              ]
            },
            {
              "id": "R3",
              "name": "R3",
              "type": "R",
              "value": "3k",
              "resistorStyle": "zigzag",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 240,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 280,
                  "y": 60
                }
              ]
            },
            {
              "id": "R4",
              "name": "R4",
              "type": "R",
              "value": "1.5k",
              "resistorStyle": "zigzag",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 320,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 360,
                  "y": 60
                }
              ]
            },
            {
              "id": "R5",
              "name": "R5",
              "type": "R",
              "value": "680",
              "resistorStyle": "zigzag",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 200,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 200,
                  "y": 100
                }
              ]
            },
            {
              "id": "R6",
              "name": "R6",
              "type": "R",
              "value": "4.7k",
              "resistorStyle": "zigzag",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 140,
                  "y": 140
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 180,
                  "y": 140
                }
              ]
            },
            {
              "id": "C1",
              "name": "C1",
              "type": "C",
              "value": "47n",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 120,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 120,
                  "y": 100
                }
              ]
            },
            {
              "id": "C2",
              "name": "C2",
              "type": "C",
              "value": "220n",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 240,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 240,
                  "y": 100
                }
              ]
            },
            {
              "id": "L1",
              "name": "L1",
              "type": "L",
              "value": "5m",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 410,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 410,
                  "y": 100
                }
              ]
            },
            {
              "id": "GND1",
              "name": "GND1",
              "type": "GND",
              "value": "",
              "groundVariant": "earth",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 220,
                  "y": 220
                }
              ]
            }
          ],
          "wires": [
            {
              "id": "W_IN_SPINE",
              "points": [
                {
                  "x": 40,
                  "y": 60
                },
                {
                  "x": 40,
                  "y": 20
                },
                {
                  "x": 100,
                  "y": 20
                },
                {
                  "x": 100,
                  "y": 40
                },
                {
                  "x": 60,
                  "y": 40
                },
                {
                  "x": 60,
                  "y": 60
                },
                {
                  "x": 80,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_R1_R2",
              "points": [
                {
                  "x": 120,
                  "y": 60
                },
                {
                  "x": 120,
                  "y": 80
                },
                {
                  "x": 180,
                  "y": 80
                },
                {
                  "x": 180,
                  "y": 40
                },
                {
                  "x": 140,
                  "y": 40
                },
                {
                  "x": 140,
                  "y": 60
                },
                {
                  "x": 160,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_R2_R3",
              "points": [
                {
                  "x": 200,
                  "y": 60
                },
                {
                  "x": 200,
                  "y": 20
                },
                {
                  "x": 260,
                  "y": 20
                },
                {
                  "x": 260,
                  "y": 40
                },
                {
                  "x": 220,
                  "y": 40
                },
                {
                  "x": 220,
                  "y": 60
                },
                {
                  "x": 240,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_R3_R4",
              "points": [
                {
                  "x": 280,
                  "y": 60
                },
                {
                  "x": 280,
                  "y": 100
                },
                {
                  "x": 340,
                  "y": 100
                },
                {
                  "x": 340,
                  "y": 40
                },
                {
                  "x": 300,
                  "y": 40
                },
                {
                  "x": 300,
                  "y": 60
                },
                {
                  "x": 320,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_R4_L1",
              "points": [
                {
                  "x": 360,
                  "y": 60
                },
                {
                  "x": 360,
                  "y": 20
                },
                {
                  "x": 420,
                  "y": 20
                },
                {
                  "x": 420,
                  "y": 40
                },
                {
                  "x": 380,
                  "y": 40
                },
                {
                  "x": 380,
                  "y": 60
                },
                {
                  "x": 410,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_RETURN_A",
              "points": [
                {
                  "x": 40,
                  "y": 100
                },
                {
                  "x": 40,
                  "y": 160
                },
                {
                  "x": 100,
                  "y": 160
                },
                {
                  "x": 100,
                  "y": 120
                },
                {
                  "x": 80,
                  "y": 120
                },
                {
                  "x": 80,
                  "y": 100
                },
                {
                  "x": 120,
                  "y": 100
                },
                {
                  "x": 120,
                  "y": 120
                },
                {
                  "x": 140,
                  "y": 120
                },
                {
                  "x": 140,
                  "y": 140
                }
              ]
            },
            {
              "id": "W_RETURN_C",
              "points": [
                {
                  "x": 200,
                  "y": 100
                },
                {
                  "x": 200,
                  "y": 180
                }
              ]
            },
            {
              "id": "W3",
              "points": [
                {
                  "x": 200,
                  "y": 180
                },
                {
                  "x": 220,
                  "y": 180
                }
              ]
            },
            {
              "id": "W4",
              "points": [
                {
                  "x": 220,
                  "y": 180
                },
                {
                  "x": 260,
                  "y": 180
                },
                {
                  "x": 260,
                  "y": 120
                },
                {
                  "x": 220,
                  "y": 120
                },
                {
                  "x": 220,
                  "y": 100
                },
                {
                  "x": 240,
                  "y": 100
                },
                {
                  "x": 240,
                  "y": 160
                },
                {
                  "x": 420,
                  "y": 160
                },
                {
                  "x": 420,
                  "y": 120
                },
                {
                  "x": 360,
                  "y": 120
                },
                {
                  "x": 360,
                  "y": 100
                },
                {
                  "x": 410,
                  "y": 100
                }
              ]
            },
            {
              "id": "W_GND_TAP",
              "points": [
                {
                  "x": 220,
                  "y": 140
                },
                {
                  "x": 220,
                  "y": 180
                }
              ]
            },
            {
              "id": "W1",
              "points": [
                {
                  "x": 200,
                  "y": 180
                },
                {
                  "x": 180,
                  "y": 180
                }
              ]
            },
            {
              "id": "W5",
              "points": [
                {
                  "x": 180,
                  "y": 180
                },
                {
                  "x": 180,
                  "y": 140
                }
              ]
            },
            {
              "id": "W2",
              "points": [
                {
                  "x": 180,
                  "y": 180
                },
                {
                  "x": 180,
                  "y": 200
                },
                {
                  "x": 220,
                  "y": 200
                },
                {
                  "x": 220,
                  "y": 220
                }
              ]
            }
          ]
        },
        "editor": {
          "view": {
            "x": -35.61446961700898,
            "y": -173.47088601045294,
            "width": 531.228939234018,
            "height": 586.9417720209059
          },
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 10,
            "snap": true,
            "visible": false
          }
        },
        "simulation": {
          "config": {
            "activeKind": "op",
            "op": {},
            "dc": {
              "source": "V1",
              "start": "0",
              "stop": "12",
              "step": "1"
            },
            "tran": {
              "source": "V1",
              "sourceMode": "pulse",
              "sourceValue": "pulse(0 5 1m 1u 1u 5m 10m)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "1",
              "sineFreq": "1k",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "10m",
              "step": "0.1m",
              "maxStep": ""
            },
            "ac": {
              "source": "V1",
              "sourceValue": "",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": [
                "all"
              ]
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": true
          },
          "resultsPane": {
            "mode": "split",
            "splitRatio": 0.48921933085501856
          },
          "settings": {
            "autoSwitchToSelectOnPlace": true,
            "autoSwitchToSelectOnWire": false,
            "includeSchematicValueUnitSpace": true,
            "schematicText": {
              "font": "Segoe UI",
              "size": 12,
              "bold": false,
              "italic": false
            },
            "componentDefaults": {
              "R": {
                "value": "1k",
                "netColor": "#8a151b"
              },
              "C": {
                "value": "1u",
                "netColor": "#8a151b"
              },
              "L": {
                "value": "1m",
                "netColor": "#8a151b"
              },
              "XFMR": {
                "value": "1",
                "netColor": "#8a151b",
                "xfmrPolarity": "subtractive",
                "xfmrSolveBy": "ratio"
              },
              "V": {
                "value": "1",
                "netColor": "#8a151b"
              },
              "VAC": {
                "value": "",
                "netColor": "#8a151b",
                "vacAmplitude": "1",
                "vacFrequency": "1k",
                "vacWaveform": "sine"
              },
              "I": {
                "value": "1",
                "netColor": "#8a151b"
              },
              "VM": {
                "value": "",
                "netColor": "#8a151b"
              },
              "AM": {
                "value": "",
                "netColor": "#8a151b"
              },
              "SW": {
                "value": "",
                "netColor": "#8a151b"
              },
              "SPST": {
                "value": "",
                "netColor": "#8a151b"
              },
              "D": {
                "value": "1N4148",
                "netColor": "#8a151b"
              },
              "NET": {
                "value": "",
                "netColor": "#1d1d1f"
              },
              "TEXT": {
                "value": "",
                "netColor": "#1d1d1f"
              },
              "ARR": {
                "value": "",
                "netColor": "#1d1d1f"
              },
              "BOX": {
                "value": "",
                "netColor": "#1d1d1f"
              }
            },
            "toolDisplayDefaults": {
              "resistorStyle": "zigzag",
              "groundVariant": "earth",
              "groundColor": "#8a151b",
              "probeColor": "#1d1d1f"
            },
            "wireDefaultColor": "#24a148"
          }
        }
      }
    },
    {
      "file": "Wire-simplify-demo.json",
      "doc": {
        "schema": "spjutsim/schematic",
        "version": 1,
        "title": "",
        "createdAt": "2026-03-08T19:03:14.624Z",
        "updatedAt": "2026-03-10T04:10:36.244Z",
        "schematic": {
          "components": [
            {
              "id": "V1",
              "name": "V1",
              "type": "V",
              "value": "10",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 40,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 40,
                  "y": 100
                }
              ]
            },
            {
              "id": "R1",
              "name": "R1",
              "type": "R",
              "value": "1k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 80,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 120,
                  "y": 60
                }
              ],
              "resistorStyle": "zigzag"
            },
            {
              "id": "R2",
              "name": "R2",
              "type": "R",
              "value": "2k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 160,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 200,
                  "y": 60
                }
              ],
              "resistorStyle": "zigzag"
            },
            {
              "id": "R3",
              "name": "R3",
              "type": "R",
              "value": "2k",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 240,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 240,
                  "y": 100
                }
              ],
              "resistorStyle": "zigzag"
            },
            {
              "id": "C1",
              "name": "C1",
              "type": "C",
              "value": "100n",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 120,
                  "y": 60
                },
                {
                  "id": "2",
                  "name": "2",
                  "x": 120,
                  "y": 100
                }
              ]
            },
            {
              "id": "GND1",
              "name": "GND1",
              "type": "GND",
              "value": "",
              "pins": [
                {
                  "id": "1",
                  "name": "1",
                  "x": 140,
                  "y": 180
                }
              ],
              "groundVariant": "earth"
            }
          ],
          "wires": [
            {
              "id": "W_IN_ZIG",
              "points": [
                {
                  "x": 40,
                  "y": 60
                },
                {
                  "x": 40,
                  "y": 40
                },
                {
                  "x": 100,
                  "y": 40
                },
                {
                  "x": 100,
                  "y": 60
                },
                {
                  "x": 80,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_MID_ZIG",
              "points": [
                {
                  "x": 120,
                  "y": 60
                },
                {
                  "x": 120,
                  "y": 80
                },
                {
                  "x": 180,
                  "y": 80
                },
                {
                  "x": 180,
                  "y": 60
                },
                {
                  "x": 160,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_OUT_ZIG",
              "points": [
                {
                  "x": 200,
                  "y": 60
                },
                {
                  "x": 200,
                  "y": 40
                },
                {
                  "x": 260,
                  "y": 40
                },
                {
                  "x": 260,
                  "y": 60
                },
                {
                  "x": 240,
                  "y": 60
                }
              ]
            },
            {
              "id": "W_GND_LEFT",
              "points": [
                {
                  "x": 40,
                  "y": 100
                },
                {
                  "x": 40,
                  "y": 140
                },
                {
                  "x": 120,
                  "y": 140
                },
                {
                  "x": 120,
                  "y": 100
                }
              ]
            },
            {
              "id": "W_GND_RIGHT",
              "points": [
                {
                  "x": 120,
                  "y": 100
                },
                {
                  "x": 120,
                  "y": 120
                },
                {
                  "x": 260,
                  "y": 120
                },
                {
                  "x": 260,
                  "y": 100
                },
                {
                  "x": 240,
                  "y": 100
                }
              ]
            },
            {
              "id": "W_GND_SYMBOL",
              "points": [
                {
                  "x": 120,
                  "y": 100
                },
                {
                  "x": 100,
                  "y": 100
                },
                {
                  "x": 100,
                  "y": 180
                },
                {
                  "x": 140,
                  "y": 180
                }
              ]
            }
          ]
        },
        "editor": {
          "view": {
            "x": -115.61446961700898,
            "y": -183.47088601045294,
            "width": 531.228939234018,
            "height": 586.9417720209059
          },
          "selection": {
            "componentIds": [],
            "wireIds": []
          },
          "grid": {
            "size": 10,
            "snap": true,
            "visible": false
          }
        },
        "simulation": {
          "config": {
            "activeKind": "op",
            "op": {},
            "dc": {
              "source": "V1",
              "start": "0",
              "stop": "10",
              "step": "1"
            },
            "tran": {
              "source": "V1",
              "sourceMode": "pulse",
              "sourceValue": "pulse(0 5 1m 1u 1u 5m 10m)",
              "dcValue": "5",
              "pulseLow": "0",
              "pulseHigh": "5",
              "pulseDelay": "1m",
              "pulseRise": "1u",
              "pulseFall": "1u",
              "pulseWidth": "5m",
              "pulsePeriod": "10m",
              "sineOffset": "0",
              "sineAmplitude": "1",
              "sineFreq": "1k",
              "sineDelay": "",
              "sineDamping": "",
              "sinePhase": "",
              "pwlPoints": "0 0\n1m 5\n2m 0",
              "customValue": "",
              "start": "0",
              "stop": "10m",
              "step": "0.1m",
              "maxStep": ""
            },
            "ac": {
              "source": "V1",
              "sourceValue": "",
              "sweep": "dec",
              "points": "10",
              "start": "1",
              "stop": "100k"
            },
            "save": {
              "signals": [
                "all"
              ]
            }
          },
          "preamble": ""
        },
        "ui": {
          "plot": {
            "showGrid": true
          },
          "resultsPane": {
            "mode": "split",
            "splitRatio": 0.48921933085501856
          },
          "settings": {
            "autoSwitchToSelectOnPlace": true,
            "autoSwitchToSelectOnWire": false,
            "includeSchematicValueUnitSpace": true,
            "schematicText": {
              "font": "Segoe UI",
              "size": 12,
              "bold": false,
              "italic": false
            },
            "componentDefaults": {
              "R": {
                "value": "1k",
                "netColor": "#8a151b"
              },
              "C": {
                "value": "1u",
                "netColor": "#8a151b"
              },
              "L": {
                "value": "1m",
                "netColor": "#8a151b"
              },
              "XFMR": {
                "value": "1",
                "netColor": "#8a151b",
                "xfmrPolarity": "subtractive",
                "xfmrSolveBy": "ratio"
              },
              "V": {
                "value": "1",
                "netColor": "#8a151b"
              },
              "VAC": {
                "value": "",
                "netColor": "#8a151b",
                "vacAmplitude": "1",
                "vacFrequency": "1k",
                "vacWaveform": "sine"
              },
              "I": {
                "value": "1",
                "netColor": "#8a151b"
              },
              "VM": {
                "value": "",
                "netColor": "#8a151b"
              },
              "AM": {
                "value": "",
                "netColor": "#8a151b"
              },
              "SW": {
                "value": "",
                "netColor": "#8a151b"
              },
              "SPST": {
                "value": "",
                "netColor": "#8a151b"
              },
              "D": {
                "value": "1N4148",
                "netColor": "#8a151b"
              },
              "NET": {
                "value": "",
                "netColor": "#1d1d1f"
              },
              "TEXT": {
                "value": "",
                "netColor": "#1d1d1f"
              },
              "ARR": {
                "value": "",
                "netColor": "#1d1d1f"
              },
              "BOX": {
                "value": "",
                "netColor": "#1d1d1f"
              }
            },
            "toolDisplayDefaults": {
              "resistorStyle": "zigzag",
              "groundVariant": "earth",
              "groundColor": "#8a151b",
              "probeColor": "#1d1d1f"
            },
            "wireDefaultColor": "#24a148"
          }
        }
      }
    }
  ]
};
})();
