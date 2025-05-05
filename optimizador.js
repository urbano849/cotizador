console.log('Script loaded'); // Log al inicio del script

/**
 * Displays a message to the user in a styled box.
 * @param {string} message The text to display.
 * @param {string} type 'error' or 'success'/'info'.
 * @param {number} duration Time in ms to show the message.
 */
function showMessage(message, type = 'error', duration = 3000) {
    console.log(`showMessage called: ${message} (${type})`); // Log showMessage calls
    const messageBox = document.getElementById('messageBox');
    if (!messageBox) {
        console.error("Message box element not found!");
        return;
    }
    messageBox.textContent = message;
    messageBox.className = 'message-box'; // Reset classes
    if (type !== 'error') {
        messageBox.classList.add('success');
    }
    messageBox.style.display = 'block';
    // Hide after duration
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, duration);
}

/**
 * Adds a new row for entering piece dimensions to the piece table.
 */
function addPiece() {
    console.log('addPiece called'); // Log function call
    try {
        const pieceTableBody = document.querySelector('#pieceTable tbody');
         if (!pieceTableBody) {
             console.error("Piece table body not found!");
             return;
         }
        const newRow = document.createElement('tr');
        // Añadir clases de Tailwind a los inputs de la nueva fila
        newRow.innerHTML = `
            <td><input type="number" class="pieceWidth p-1 border border-gray-300 rounded-md" value="100" min="1"></td>
            <td><input type="number" class="pieceHeight p-1 border border-gray-300 rounded-md" value="100" min="1"></td>
            <td><input type="number" class="pieceQty p-1 border border-gray-300 rounded-md" value="1" min="1"></td>
            <td><button class="btn-delete bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs" onclick="removePiece(this)">Eliminar</button></td>
        `;
        pieceTableBody.appendChild(newRow);
        console.log('Piece row added.'); // Log successful addition
    } catch (error) {
        console.error("Error in addPiece:", error); // Log errors in addPiece
        showMessage("Error al añadir pieza.", 'error');
    }
}


/**
 * Removes the piece input row associated with the clicked button.
 * @param {HTMLButtonElement} button The 'Eliminar' button that was clicked.
 */
function removePiece(button) {
     console.log('removePiece called'); // Log function call
     try {
         const row = button.closest('tr'); // Use closest to find the parent table row
         if (row) {
             row.remove();
             console.log('Piece row removed.'); // Log successful removal
         } else {
             console.warn("Could not find parent row to remove.");
         }
     } catch (error) {
         console.error("Error in removePiece:", error); // Log errors in removePiece
         showMessage("Error al eliminar pieza.", 'error');
     }
}

/**
 * Represents a free rectangular area on a sheet where pieces can be placed.
 * In this strip-based approach, this represents a segment within a horizontal strip.
 * @typedef {object} FreeRectangle
 * @property {number} x - X coordinate of the top-left corner.
 * @property {number} y - Y coordinate of the top-left corner (should be the same for all nodes in a strip).
 * @property {number} width - Width of the free segment.
 * @property {number} height - Height of the free segment (should be the same for all nodes in a strip).
 * @property {number} area - Area of the segment (width * height).
 */

/**
 * Represents a piece to be cut.
 * @typedef {object} Piece
 * @property {string} id - Unique identifier for the piece instance.
 * @property {number} originalIndex - Index of the piece definition in the input list.
 * @property {number} width - Original width of the piece.
 * @property {number} height - Original height of the piece.
 * @property {number} placedWidth - Actual width used for placement (can be rotated).
 * @property {number} placedHeight - Actual height used for placement (can be rotated).
 * @property {number} area - Area of the piece (width * height).
 * @property {boolean} placed - Whether the piece has been placed on a sheet.
 * @property {number} [x] - X coordinate if placed.
 * @property {number} [y] - Y coordinate if placed.
 * @property {number} [sheetIndex] - Index of the sheet if placed.
 */

/**
 * Represents a single sheet with placed pieces and remaining free areas (strips).
 * In this strip-based approach, freeRectangles will represent the remaining segments within horizontal strips.
 * @typedef {object} Sheet
 * @property {number} width - Width of the sheet.
 * @property {number} height - Height of the sheet.
 * @property {Array<Piece & {x: number, y: number}>} placedPieces - List of pieces placed on this sheet with their coordinates.
 * @property {Array<FreeRectangle>} freeRectangles - List of available rectangular segments within strips.
 * @property {number} usefulArea - Calculated useful area for this sheet.
 * @property {number} wasteArea - Calculated waste area for this sheet.
 * @property {number} currentStripY - The Y coordinate of the lowest point occupied by a piece, defining where the next strip could start.
 */

// Global variable to hold sheets data
let sheets = [];

/**
 * Main function to trigger the optimization process.
 */
function optimizeCuts() {
    console.log('optimizeCuts called'); // Log function call
    try {
        // Clear the global sheets array for a new optimization run
        sheets = [];
        console.log('Sheets array cleared.'); // Log step

        // 1. Get Input Data and Validate
        console.log('Getting input data...'); // Log step
        const sheetWidth = parseInt(document.getElementById('sheetWidth').value);
        const sheetHeight = parseInt(document.getElementById('sheetHeight').value);
        const kerf = parseFloat(document.getElementById('kerf').value);
        const margin = parseFloat(document.getElementById('margin').value) || 0;
        const sheetHasGrain = document.getElementById('sheetGrain').checked;
        const sortPriority = document.getElementById('sortPriority').value; // Get selected sorting priority

        console.log(`Inputs: Width=${sheetWidth}, Height=${sheetHeight}, Kerf=${kerf}, Margin=${margin}, Grain=${sheetHasGrain}, Sort=${sortPriority}`); // Log inputs

        if (isNaN(sheetWidth) || isNaN(sheetHeight) || sheetWidth <= 0 || sheetHeight <= 0) {
            showMessage("Por favor, introduce dimensiones válidas (> 0) para la plancha.", 'error');
            console.error("Invalid sheet dimensions.");
            return;
        }
        if (isNaN(kerf) || kerf < 0) {
             showMessage("El grosor de la sierra no puede ser negativo.", 'error');
             console.error("Invalid kerf value.");
             return;
        }
         if (isNaN(margin) || margin < 0) {
             showMessage("El margen no puede ser negativo.", 'error');
             console.error("Invalid margin value.");
             return;
         }

         if (sheetWidth < 2 * margin || sheetHeight < 2 * margin) {
              showMessage("La plancha es demasiado pequeña para el margen especificado.", 'error');
              console.error("Sheet too small for margin.");
              return;
         }

        const usableWidth = sheetWidth - 2 * margin;
        const usableHeight = sheetHeight - 2 * margin;
         console.log(`Usable area: ${usableWidth}x${usableHeight}`); // Log usable area;


        const pieceRows = document.querySelectorAll('#pieceTable tbody tr');
        let piecesToCut = [];
        let invalidPiecesFound = false;
        console.log(`Found ${pieceRows.length} piece rows.`); // Log piece rows count

        pieceRows.forEach((row, index) => {
            const wInput = row.querySelector('.pieceWidth');
            const hInput = row.querySelector('.pieceHeight');
            const qtyInput = row.querySelector('.pieceQty');

            if (!wInput || !hInput || !qtyInput) {
                console.warn(`Skipping row ${index} due to missing inputs.`); // Warn on missing inputs
                invalidPiecesFound = true;
                return;
            }

            const w = parseInt(wInput.value);
            const h = parseInt(hInput.value);
            const qty = parseInt(qtyInput.value);
             console.log(`Piece row ${index}: w=${w}, h=${h}, qty=${qty}`); // Log piece inputs


            if (isNaN(w) || isNaN(h) || isNaN(qty) || w <= 0 || h <= 0 || qty <= 0) {
                 if (w || h || qty) {
                     console.warn(`Invalid input in row ${index}.`); // Warn on invalid numbers
                     invalidPiecesFound = true;
                 }
                 return;
            }

            let fitsInOriginal = (w <= usableWidth && h <= usableHeight);
            let fitsInRotated = (!sheetHasGrain && h <= usableWidth && w <= usableHeight); // Only if no grain

            if (sheetHasGrain) {
                if (!fitsInOriginal) {
                     console.warn(`Piece ${index} (${w}x${h}) too large for usable area with grain.`); // Warn if too large with grain
                     invalidPiecesFound = true;
                     return;
                }
            } else {
                 if (!fitsInOriginal && !fitsInRotated) {
                      console.warn(`Piece ${index} (${w}x${h}) too large for usable area in any orientation.`); // Warn if too large without grain
                      invalidPiecesFound = true;
                      return;
                 }
            }


            for (let i = 0; i < qty; i++) {
                piecesToCut.push({
                    id: `${index}-${i}`,
                    originalIndex: index,
                    width: w,
                    height: h,
                    area: w * h,
                    placed: false,
                    placedWidth: w, // Initialize placed dimensions
                    placedHeight: h
                });
            }
        });

        if (invalidPiecesFound) {
             showMessage("Algunas piezas tienen dimensiones/cantidad inválida o son más grandes que el área útil de la plancha. Serán ignoradas o podrían no caber.", 'info', 6000);
        }
        if (piecesToCut.length === 0) {
            showMessage("Añade al menos una pieza válida para optimizar.", 'error');
            document.getElementById('summary').innerText = "No hay piezas válidas para procesar.";
            document.getElementById('sheetVisuals').innerHTML = '';
            console.warn("No valid pieces to cut.");
            return;
        }
        console.log(`Pieces to cut: ${piecesToCut.length}`); // Log count of valid pieces


        // Sort pieces based on selected priority
         try {
             piecesToCut.sort((a, b) => {
                 switch (sortPriority) {
                     case 'area_desc':
                         return b.area - a.area; // Area Descending
                     case 'width_desc':
                         if (b.width !== a.width) return b.width - a.width; // Width Descending
                         return b.height - a.height; // Then Height Descending
                     case 'height_asc':
                         if (a.height !== b.height) return a.height - b.height; // Height Ascending
                         return a.width - b.width; // Then Width Ascending
                     case 'height_desc':
                     default: // Default to Height Descending, Width Descending
                         if (b.height !== a.height) return b.height - a.height;
                         return b.width - a.width;
                 }
             });
             console.log(`Pieces sorted by ${sortPriority}.`); // Log sorting completion
         } catch (sortError) {
              console.error("Error during piece sorting:", sortError); // Catch and log sorting errors
              showMessage("Error al ordenar piezas.", 'error');
              return; // Stop if sorting fails
         }


        // --- Algorithm Start (Strip Packing with Best Fit) ---
        console.log('Starting strip packing algorithm with Best Fit...'); // Log algorithm start

        piecesToCut.forEach((piece) => {
            if (piece.placed) {
                return; // Use return in forEach to skip to the next iteration
            }

            let bestFitSheetIndex = -1;
            let bestFitNodeIndex = -1; // Index within the freeRectangles list of the sheet
            let bestOrientation = { width: piece.width, height: piece.height };

            // Criteria for best fit:
            // When grain is active: Prioritize filling horizontally in existing strips with matching height.
            // When no grain or no matching strip found: Prioritize height match, then Y, then X, then minimize waste area.

            let minHeightDifference = Infinity;
            let bestY = Infinity;
            bestX = Infinity;
            let minWasteInSpot = Infinity;

            let foundStrictGrainFit = false; // Flag to indicate if a strict grain fit was found


            // --- Strict Priority for Grain (Exact Height Match) ---
            if (sheetHasGrain) {
                 console.log(`Attempting Strict Grain Fit for piece ${piece.id} (${piece.width}x${piece.height})...`);
                 let strictBestSheetIndex = -1;
                 let strictBestNodeIndex = -1;
                 let strictBestX = Infinity; // Prioritize leftmost within matching height

                 for (let i = 0; i < sheets.length; i++) {
                     const sheet = sheets[i];
                     // Sort free rectangles by Y then X for consistent search
                     sheet.freeRectangles.sort((a, b) => {
                         if (a.y !== b.y) return a.y - b.y;
                         return a.x - b.x;
                     });

                     for (let j = 0; j < sheet.freeRectangles.length; j++) {
                         const node = sheet.freeRectangles[j];

                         // Check if the piece fits in original orientation (only allowed with grain)
                         // AND if the height matches the node's height within a small tolerance
                         if (piece.width <= node.width && piece.height <= node.height &&
                             Math.abs(piece.height - node.height) < kerf * 2) // Use tolerance for height match
                         {
                              // Found a potential strict grain fit. Prioritize leftmost.
                              if (node.x < strictBestX) {
                                   strictBestX = node.x;
                                   strictBestSheetIndex = i;
                                   strictBestNodeIndex = j;
                                   // Orientation is implicitly original
                              }
                         }
                     }
                 }

                 // If a strict grain fit was found, use it and mark as placed
                 if (strictBestSheetIndex !== -1) {
                     console.log(`Strict Grain Fit successful for piece ${piece.id} in sheet ${strictBestSheetIndex}, node ${strictBestNodeIndex}.`);
                     piece.placedWidth = piece.width;
                     piece.placedHeight = piece.height;
                     placePieceInNodeInStrip(piece, sheets[strictBestSheetIndex], strictBestNodeIndex, kerf, margin);
                     foundStrictGrainFit = true; // Mark that a strict fit was used
                 } else {
                      console.log(`No Strict Grain Fit found for piece ${piece.id}.`);
                 }
            }


            // --- General Best Fit (if no Strict Grain Fit found or no grain) ---
            if (!foundStrictGrainFit) {
                 console.log(`Attempting General Best Fit for piece ${piece.id}.`);
                 // Try placing in existing sheets/strips first (using general best fit criteria)
                 for (let i = 0; i < sheets.length; i++) {
                     const sheet = sheets[i];

                     // Sort free rectangles by Y then X
                      sheet.freeRectangles.sort((a, b) => {
                          if (a.y !== b.y) return a.y - b.y;
                          return a.x - b.x;
                      });


                     for (let j = 0; j < sheet.freeRectangles.length; j++) {
                         const node = sheet.freeRectangles[j];

                         // Check if the piece fits in this free segment (node) in either orientation
                         let fitsInOriginal = (piece.width <= node.width && piece.height <= node.height);
                         let fitsInRotated = (!sheetHasGrain && piece.height <= node.width && piece.width <= node.height); // Only if no grain

                         // Evaluate original orientation if it fits
                         if (fitsInOriginal) {
                             const currentHeightDifference = Math.abs(piece.height - node.height);
                             const currentWaste = (node.width * node.height) - (piece.width * piece.height);

                             // Apply priority: first height difference, then Y, then X, then waste
                             if (currentHeightDifference < minHeightDifference ||
                                 (currentHeightDifference === minHeightDifference && node.y < bestY) ||
                                 (currentHeightDifference === minHeightDifference && node.y === bestY && node.x < bestX) ||
                                 (currentHeightDifference === minHeightDifference && node.y === bestY && node.y === bestY && node.x === bestX && currentWaste < minWasteInSpot)) // Added node.y === bestY check
                             {
                                 minHeightDifference = currentHeightDifference;
                                 bestY = node.y;
                                 bestX = node.x;
                                 minWasteInSpot = currentWaste;
                                 bestFitSheetIndex = i;
                                 bestFitNodeIndex = j;
                                 bestOrientation = { width: piece.width, height: piece.height };
                             }
                         }

                         // Evaluate rotated orientation if it fits (and grain allows)
                         if (fitsInRotated) {
                             const currentHeightDifference = Math.abs(piece.width - node.height); // Compare rotated height to node height
                             const currentWaste = (node.width * node.height) - (piece.height * piece.width); // Area is the same
                             // Apply priority: first height difference, then Y, then X, then waste
                             if (currentHeightDifference < minHeightDifference ||
                                 (currentHeightDifference === minHeightDifference && node.y < bestY) ||
                                 (currentHeightDifference === minHeightDifference && node.y === bestY && node.x < bestX) ||
                                 (currentHeightDifference === minHeightDifference && node.y === bestY && node.y === bestY && node.x === bestX && currentWaste < minWasteInSpot)) // Added node.y === bestY check
                             {
                                 minHeightDifference = currentHeightDifference;
                                 bestY = node.y;
                                 bestX = node.x;
                                 minWasteInSpot = currentWaste;
                                 bestFitSheetIndex = i;
                                 bestFitNodeIndex = j;
                                 bestOrientation = { width: piece.height, height: piece.width }; // Store rotated dimensions
                             }
                         }
                     }
                 }

                 // If a suitable spot was found in existing sheets/strips using general Best Fit
                 if (bestFitSheetIndex !== -1) {
                     console.log(`General Best Fit successful for piece ${piece.id} in sheet ${bestFitSheetIndex}, node ${bestFitNodeIndex}.`);
                     // Place the piece in the best-fitting node based on the prioritized criteria
                     piece.placedWidth = bestOrientation.width;
                     piece.placedHeight = bestOrientation.height;
                     placePieceInNodeInStrip(piece, sheets[bestFitSheetIndex], bestFitNodeIndex, kerf, margin);

                 } else {
                     // No fit in existing sheets using either strict or general criteria.
                     // Need a new sheet or a new strip in an existing sheet.
                     console.log(`No fit found for piece ${piece.id} in existing sheets. Attempting to create new strip/sheet.`);

                     let placedInNewStrip = false;
                     // Try to find an existing sheet where a new strip can be started
                     for (let i = 0; i < sheets.length; i++) {
                         const sheet = sheets[i];
                         // The Y coordinate for the new strip would be sheet.currentStripY + kerf
                          // Ensure new strip starts below the lowest placed piece, plus kerf, and within sheet bounds
                         const newStripY = (sheet.placedPieces.length > 0 ? sheet.currentStripY + kerf : margin); // Start at margin if first piece
                          // Let's use the piece's original height for determining potential new strip height if it fits.
                          const potentialNewStripHeight = piece.height;


                         // Check if there's enough height remaining for the piece in a new strip
                         if (newStripY + potentialNewStripHeight <= sheetHeight - margin) {

                              // Determine the orientation for the new strip based on sheet grain
                             let newStripOrientation = { width: piece.width, height: piece.height };
                             let fitsInNewStrip = (piece.width <= usableWidth && piece.height <= usableHeight);

                             if (!sheetHasGrain) {
                                 // If no grain, check if rotated fits better in the strip width
                                 if (piece.height <= usableWidth && piece.width <= usableHeight) {
                                      // If rotated fits and leaves less remaining width, prefer it for the new strip
                                      if (usableWidth - piece.height < usableWidth - piece.width) {
                                           newStripOrientation = { width: piece.height, height: piece.width };
                                      }
                                 }
                             }

                             // Re-check fit with the chosen orientation for the new strip
                             if (newStripOrientation.width <= usableWidth && newStripOrientation.height <= (sheetHeight - margin - newStripY)) {
                                  // Create a new free rectangle representing the new strip
                                  const newStripNode = {
                                      x: margin, // New strip starts at the left margin
                                      y: newStripY,
                                      width: usableWidth, // Full usable width of the new strip
                                      height: newStripOrientation.height, // Height is the height of the piece being placed in this new strip
                                      area: usableWidth * newStripOrientation.height
                                  };
                                  sheet.freeRectangles.push(newStripNode);
                                  // Sort free rectangles again to include the new node - sort by Y then X
                                  sheet.freeRectangles.sort((a, b) => {
                                      if (a.y !== b.y) return a.y - b.y;
                                      return a.x - b.x;
                                  });

                                  // Find the index of the newly added node
                                  const newNodeIndex = sheet.freeRectangles.findIndex(node => node.x === margin && node.y === newStripY && node.height === newStripOrientation.height);


                                  if (newNodeIndex !== -1) {
                                      // Place the piece in this new strip node
                                      piece.placedWidth = newStripOrientation.width;
                                      piece.placedHeight = newStripOrientation.height;
                                      placePieceInNodeInStrip(piece, sheet, newNodeIndex, kerf, margin);
                                      placedInNewStrip = true;
                                      break; // Piece placed, move to next piece
                                  } else {
                                       console.error("Error finding the newly added strip node after push and sort.");
                                  }
                             }
                         }
                     }

                     // If the piece wasn't placed in a new strip in an existing sheet, create a new sheet
                     if (!placedInNewStrip) {

                         let newSheetOrientation = { width: piece.width, height: piece.height };
                         const fitsInOriginalNewSheet = (piece.width <= usableWidth && piece.height <= usableHeight);
                         const fitsInRotatedNewSheet = (!sheetHasGrain && piece.height <= usableWidth && piece.width <= usableHeight);


                         if (!fitsInOriginalNewSheet && !fitsInRotatedNewSheet) {
                              showMessage(`Pieza ${piece.id} (${piece.width}x${piece.height}) es más grande que el área útil de la plancha (${usableWidth}x${usableHeight}) con margen ${margin} en cualquier orientación permitida. No se puede colocar.`, 'error', 7000);
                              piece.placed = false; // Mark as unplaced
                              return; // Use return in forEach to skip to the next iteration
                          }

                          // If no grain, choose the orientation that fits and potentially leaves more width in the initial strip
                          if (!sheetHasGrain && fitsInOriginalNewSheet && fitsInRotatedNewSheet) {
                               if (usableWidth - piece.height < usableWidth - piece.width) { // Compare remaining width after placing rotated vs original
                                    newSheetOrientation = { width: piece.height, height: piece.width };
                               }
                          } else if (!sheetHasGrain && fitsInRotatedNewSheet && !fitsInOriginalNewSheet) {
                               // Only rotated fits
                               newSheetOrientation = { width: piece.height, height: piece.width };
                          }
                          // If sheetHasGrain is true, newSheetOrientation remains the original, which was already checked to fit.


                         const newSheet = {
                             width: sheetWidth,
                             height: sheetHeight,
                             placedPieces: [],
                             // Initial free rectangle represents the first strip
                             freeRectangles: [{ x: margin, y: margin, width: usableWidth, height: newSheetOrientation.height }],
                             usefulArea: 0,
                             wasteArea: sheetWidth * sheetHeight,
                             currentStripY: margin + newSheetOrientation.height // Initial lowest point
                         };
                         sheets.push(newSheet);
                         const newSheetIndex = sheets.length - 1;

                         // Place the piece in the first strip of the new sheet
                         const targetNodeIndex = 0;
                         const targetNode = newSheet.freeRectangles[targetNodeIndex];

                         // This check should pass due to the earlier validation and orientation selection
                         if (newSheetOrientation.width <= targetNode.width && newSheetOrientation.height <= targetNode.height) {
                             piece.placedWidth = newSheetOrientation.width;
                             piece.placedHeight = newSheetOrientation.height;
                             placePieceInNodeInStrip(piece, newSheet, targetNodeIndex, kerf, margin);
                         } else {
                             console.error("Error: Piece cannot fit in the initial strip of a new sheet after orientation selection. This should not happen.");
                             piece.placed = false;
                         }
                     }
                 }
            }
        });

        // --- Algorithm End ---
        console.log('Algorithm finished.'); // Log algorithm end

        // 3. Calculate Summary and Prepare Visualization
        console.log('Calculating summary...'); // Log step
        const actuallyPlacedPieces = piecesToCut.filter(p => p.placed);
        const unplacedPieces = piecesToCut.filter(p => !p.placed);

        if(unplacedPieces.length > 0){
             showMessage(`${unplacedPieces.length} pieza(s) no pudieron ser colocadas. Revisa si son más grandes que el área útil de la plancha o si hay demasiadas piezas pequeñas.`, 'info', 6000);
             console.warn("Unplaced pieces:", unplacedPieces); // Log unplaced pieces
        }

        // Calculate per-sheet useful and waste area
        sheets.forEach(sheet => {
            sheet.usefulArea = sheet.placedPieces.reduce((sum, p) => sum + (p.placedWidth * p.placedHeight), 0);
            sheet.wasteArea = (sheet.width * sheet.height) - sheet.usefulArea;
        });
        console.log('Sheet stats calculated.'); // Log step


        // Update the main summary (optional, but good for total count)
         document.getElementById('summary').className = 'bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded relative mb-6'; // Success style
         document.getElementById('summary').innerText =
            `Planchas Necesarias: ${sheets.length}. ` +
            `${unplacedPieces.length > 0 ? `(${unplacedPieces.length} piezas no colocadas)` : ''}`;
         console.log('Summary updated.'); // Log step


        // 4. Draw Results on Canvas Elements
        console.log('Drawing sheets...'); // Log step
        drawSheets(sheets, kerf, margin); // Pass kerf and margin to drawing function
        console.log('Drawing complete.'); // Log finish


    } catch (error) {
        console.error("An unhandled error occurred during optimization:", error); // Log any unhandled errors
        showMessage(`Error grave durante la optimización: ${error.message}. Revisa la consola para más detalles.`, 'error', 7000); // Show error to user
        // Optionally clear results on error
         document.getElementById('summary').className = 'bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded relative mb-6'; // Error style
        document.getElementById('summary').innerText = "Error durante la optimización. Revisa la consola.";
        document.getElementById('sheetVisuals').innerHTML = '';
    }
}

/**
 * Places a piece into a specific free rectangle (node) within a strip on a sheet
 * and updates the sheet's free rectangles list for that strip.
 * @param {Piece} piece The piece object to place.
 * @param {Sheet} sheet The sheet object to place the piece on.
 * @param {number} nodeIndex The index of the free rectangle node (segment) in sheet.freeRectangles.
 * @param {number} kerf The saw kerf width (used for splitting).
 * @param {number} margin The margin width.
 */
function placePieceInNodeInStrip(piece, sheet, nodeIndex, kerf, margin) {
     console.log(`Attempting to place piece ${piece.id} in sheet index ${sheets.indexOf(sheet)}, node index ${nodeIndex}.`); // Log call

     const node = sheet.freeRectangles[nodeIndex];
     if (!node) {
         console.error(`Node at index ${nodeIndex} not found in sheet.`); // Error if node is missing
         // This might indicate a problem with how freeRectangles are managed.
         return; // Cannot proceed without a valid node
     }
     console.log(`Placing piece ${piece.id} at x:${node.x}, y:${node.y} in node (w:${node.width}, h:${node.height}).`); // Log node info


    // Assign position and sheet index to the piece
    // The Y coordinate is the Y of the strip (node)
    piece.x = node.x;
    piece.y = node.y;
    const sheetIndex = sheets.indexOf(sheet);
    if (sheetIndex === -1) {
        console.error("Error: Could not find the sheet index for piece placement!");
        // This is a critical error, indicates sheet object is not in the global sheets array.
        return;
    }
    piece.sheetIndex = sheetIndex;
    piece.placed = true;
    sheet.placedPieces.push(piece);
    console.log(`Piece ${piece.id} placed at (${piece.x}, ${piece.y}) on sheet ${sheetIndex}.`); // Log placement


    // --- Update Free Rectangles (Segments within the strip) ---
    // When a piece is placed in a segment, the remaining space to the right
    // of the placed piece within that segment becomes the new free segment.
    // The original segment is removed.

    console.log(`Splitting node at index ${nodeIndex} (original size ${node.width}x${node.height}) after placing piece ${piece.placedWidth}x${piece.placedHeight}.`); // Log splitting


    const newNodes = [];

    // Calculate the remaining space to the right within the current strip segment
    const remainingWidth = node.width - piece.placedWidth - kerf;
    const remainingHeight = node.height; // The height of the strip remains the same

    if (remainingWidth > kerf/2 && remainingHeight > kerf/2) { // Ensure meaningful dimensions
        newNodes.push({
            x: node.x + piece.placedWidth + kerf, // New segment starts to the right of the piece + kerf
            y: node.y, // Same Y as the strip
            width: remainingWidth,
            height: remainingHeight,
            area: remainingWidth * remainingHeight
        });
         console.log(`Created new node to the right: x:${node.x + piece.placedWidth + kerf}, y:${node.y}, w:${remainingWidth}, h:${remainingHeight}`); // Log new node
    } else {
         console.log(`No meaningful space remaining to the right (remainingWidth: ${remainingWidth}).`); // Log if no new node created
    }


    // Remove the original node and add the new segment (if any)
    sheet.freeRectangles.splice(nodeIndex, 1, ...newNodes);
    console.log(`Removed node ${nodeIndex}, added ${newNodes.length} new nodes. Free rectangles count is now ${sheet.freeRectangles.length}.`); // Log splice result


    // Update the currentStripY if this piece extends lower than the previous lowest point
    // Note: In a strict horizontal strip model, all pieces in a strip should have the same height,
    // so currentStripY should ideally only update when a new strip is started.
    // However, keeping this check provides robustness if pieces of slightly different heights
    // were placed in the same "logical" strip.
    const pieceBottomY = piece.y + piece.placedHeight;
    if (pieceBottomY > sheet.currentStripY) {
         console.log(`Updating currentStripY from ${sheet.currentStripY} to ${pieceBottomY}.`); // Log currentStripY update
         sheet.currentStripY = pieceBottomY;
    } else {
         console.log(`currentStripY (${sheet.currentStripY}) not updated (pieceBottomY: ${pieceBottomY}).`); // Log if currentStripY not updated
    }


    // In this strip-based approach, merging adjacent free rectangles within a strip
    // isn't strictly necessary if we always place from left to right and the
    // splitting logic only creates one new segment to the right.
    // However, if pieces of different heights were allowed within a single strip,
    // or if the splitting logic were more complex, merging might be needed.
    // For this simplified horizontal strip model, we can likely skip or simplify merging.
    // Let's keep the function signature but the implementation can be minimal or removed
    // if the new logic handles fragmentation sufficiently.
    // For now, we'll keep the existing merge logic, but it might not be as impactful
    // with the new splitting strategy.
     console.log('Calling mergeAdjacentNodes...'); // Log merge call
     mergeAdjacentNodes(sheet.freeRectangles, kerf);
     console.log('mergeAdjacentNodes finished.'); // Log merge finish
}


/**
 * Merges adjacent or overlapping free rectangles (segments within strips) in a sheet's list.
 * This helps reduce the number of free rectangles.
 * Note: With the new strip-based placement, this function's primary role might be
 * cleaning up very small remnants or handling edge cases, as the main splitting
 * logic is simpler.
 * @param {Array<FreeRectangle>} nodes The array of free rectangle nodes to modify in place.
 * @param {number} kerf The saw kerf width (used for tolerance check).
 */
function mergeAdjacentNodes(nodes, kerf) {
     console.log(`Starting merge with ${nodes.length} nodes.`); // Log merge start
     // In the strip packing approach, merging is less critical for horizontal strips
     // if pieces fully occupy the strip height. If pieces can have varying heights
     // within a strip, more complex merging would be needed.
     // For this implementation, we'll keep a basic merge that handles segments
     // that might become adjacent due to floating point inaccuracies or edge cases.

     // Sort nodes by Y, then X to process strips and segments within them
     nodes.sort((a, b) => {
         if (a.y !== b.y) return a.y - b.y;
         return a.x - b.x;
     });
     console.log('Nodes sorted for merging.'); // Log sort


     let mergedOccurred;
     do {
         mergedOccurred = false;
         const nextNodes = [];
         const nodesToProcess = [...nodes];
         nodes.length = 0; // Clear the original array

         console.log(`Merge pass starting with ${nodesToProcess.length} nodes to process.`); // Log pass start

         while(nodesToProcess.length > 0) {
              const nodeA = nodesToProcess.shift(); // Get the first node
              let mergedA = false;

              // Try to merge nodeA with any other node in the remaining list
              for (let i = 0; i < nodesToProcess.length; i++) {
                  const nodeB = nodesToProcess[i];

                   // Check for horizontal adjacency within the same approximate horizontal level (strip)
                   // They must have the same height and be horizontally adjacent, accounting for kerf.
                  if (Math.abs(nodeA.y - nodeB.y) < kerf / 2 && // Check if they are on the same horizontal level
                      Math.abs(nodeA.height - nodeB.height) < kerf / 2 && // Must have the same height (strip height)
                      Math.abs(nodeA.x + nodeA.width + kerf - nodeB.x) < kerf / 2) // NodeB is directly to the right of NodeA + kerf
                  {
                       console.log(`Merging horizontal: A(${nodeA.x},${nodeA.y},${nodeA.width},${nodeA.height}) and B(${nodeB.x},${nodeB.y},${nodeB.width},${nodeB.height})`); // Log merge
                       nodeA.width += nodeB.width + kerf; // Merge widths, accounting for kerf
                       nodeA.area = nodeA.width * nodeA.height; // Update area
                       nodesToProcess.splice(i, 1); // Remove nodeB
                       mergedOccurred = true;
                       mergedA = true;
                       i--; // Adjust index
                       // Continue checking if nodeA can merge with more nodes in this pass
                  }
                  // Vertical merging is less likely in a strict horizontal strip model,
                  // but we can keep the check for robustness if needed.
                  // For now, let's focus on horizontal merging within strips.
              }
              nextNodes.push(nodeA);
         }
         // Replace the original nodes array with the result of this pass's merges
         nodes.push(...nextNodes);
         console.log(`Merge pass finished. Nodes after pass: ${nodes.length}. Merged occurred: ${mergedOccurred}`); // Log pass end


     } while(mergedOccurred); // Repeat as long as merges are happening

     console.log(`Merge process finished. Final free rectangles count: ${nodes.length}`); // Log merge finish
}


/**
 * Draws the sheets and the placed pieces onto canvas elements,
 * including per-sheet utilization and waste percentages.
 * Also draws the margin area and remaining free rectangles (waste).
 * @param {Array<Sheet>} sheetsData Array of sheet objects.
 * @param {number} kerf The saw kerf width for drawing line thickness.
 * @param {number} margin The margin width for drawing the margin area.
 */
function drawSheets(sheetsData, kerf, margin) { // Pass kerf and margin
    console.log('drawSheets called'); // Log function call
    const visualsContainer = document.getElementById('sheetVisuals');
    if (!visualsContainer) {
         console.error("Sheet visuals container not found!"); // Error if container is missing
         return;
    }
    visualsContainer.innerHTML = ''; // Clear previous visuals
    console.log('Sheet visuals container cleared.'); // Log step


    if (sheetsData.length === 0) {
        console.log("No sheets to draw.");
        return;
    }

    console.log(`Drawing ${sheetsData.length} sheets.`); // Log sheet count

    // Create a pattern for the waste area (diagonal lines)
    const patternCanvas = document.createElement('canvas');
    const patternSize = 20; // Size of the pattern cell
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d');

    if (patternCtx) {
        // Monochromatic gray lines
        patternCtx.strokeStyle = 'rgba(128, 128, 128, 0.3)'; // Semi-transparent gray
        patternCtx.lineWidth = 1;
        patternCtx.beginPath();
        // Only draw one set of oblique lines (from bottom-left to top-right)
        patternCtx.moveTo(0, patternSize);
        patternCtx.lineTo(patternSize, 0);
        patternCtx.stroke();
    } else {
        console.error("Could not create pattern canvas context.");
    }


    sheetsData.forEach((sheet, index) => {
         console.log(`Drawing sheet ${index + 1}...`); // Log current sheet


         // Apply Tailwind classes to the sheet result div
        const sheetResultDiv = document.createElement('div');
        sheetResultDiv.className = 'sheet-result border border-gray-300 p-4 rounded-lg bg-white shadow-sm'; // Added Tailwind classes

         // Apply Tailwind classes to the sheet title
        const sheetTitle = document.createElement('h3');
        sheetTitle.className = 'text-lg font-semibold text-blue-700 mb-2'; // Added Tailwind classes
        sheetTitle.textContent = `Plancha ${index + 1} de ${sheetsData.length}`; // Added sheet count
        sheetResultDiv.appendChild(sheetTitle);

         // Apply Tailwind classes to the sheet summary
        const sheetSummary = document.createElement('p');
        sheetSummary.className = 'sheet-summary text-sm text-gray-600 mb-3'; // Added Tailwind classes
        const totalSheetArea = sheet.width * sheet.height;
        const utilizationPercentage = totalSheetArea > 0 ? ((sheet.usefulArea / totalSheetArea) * 100).toFixed(1) : 0;
        const wastePercentage = totalSheetArea > 0 ? ((sheet.wasteArea / totalSheetArea) * 100).toFixed(1) : 0;

        sheetSummary.textContent = `Utilización: ${utilizationPercentage}%. Desperdicio: ${wastePercentage}%.`;
        sheetResultDiv.appendChild(sheetSummary);


        const canvas = document.createElement('canvas');
        // Set canvas dimensions based on sheet size
        canvas.width = sheet.width;
        canvas.height = sheet.height;

        // Set aspect ratio for responsive display via CSS
        canvas.style.aspectRatio = `${sheet.width} / ${sheet.height}`;
        sheetResultDiv.appendChild(canvas); // Append canvas to the sheet result div


        visualsContainer.appendChild(sheetResultDiv); // Append the whole sheet result div


        const ctx = canvas.getContext('2d');
        if (!ctx) {
             console.error(`Could not get 2D context for canvas on sheet ${index + 1}.`); // Error if context fails
             return; // Skip drawing for this sheet if context is not available
        }


        // Draw sheet background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, sheet.width, sheet.height);

        // Draw sheet border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, sheet.width, sheet.height);

        // --- Draw Margin Area ---
        if (margin > 0) {
            ctx.fillStyle = '#e0e0e0'; // Light grey color for margin
            // Top margin
            ctx.fillRect(0, 0, sheet.width, margin);
            // Bottom margin
            ctx.fillRect(0, sheet.height - margin, sheet.width, margin);
            // Left margin (excluding corners already covered by top/bottom)
            ctx.fillRect(0, margin, margin, sheet.height - 2 * margin);
            // Right margin (excluding corners already covered by top/bottom)
            ctx.fillRect(sheet.width - margin, margin, margin, sheet.height - 2 * margin);

            /* Optional: Draw a darker border around the usable area
            ctx.strokeStyle = '#888'; // Darker grey
            ctx.lineWidth = 1;
            ctx.strokeRect(margin, margin, sheet.width - 2 * margin, sheet.height - 2 * margin);
            */
        }

         // --- Draw Remaining Free Rectangles (Waste) ---
         console.log(`Drawing ${sheet.freeRectangles.length} free rectangles (waste) for sheet ${index + 1}.`); // Log count
         // Use the created pattern for the waste area fill
         if (patternCtx) { // Ensure pattern was created successfully
            const wastePattern = ctx.createPattern(patternCanvas, 'repeat');
            if (wastePattern) {
                 ctx.fillStyle = wastePattern;
                 sheet.freeRectangles.forEach((rect) => {
                    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                 });
            } else {
                 console.error("Could not create waste pattern.");
                 // Fallback to solid color if pattern creation fails
                 ctx.fillStyle = 'rgba(128, 128, 128, 0.1)'; // Fallback to semi-transparent gray
                 sheet.freeRectangles.forEach((rect) => {
                    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                 });
            }
         } else {
              // Fallback to solid color if pattern canvas context failed
              ctx.fillStyle = 'rgba(128, 128, 128, 0.1)'; // Fallback to semi-transparent gray
              sheet.freeRectangles.forEach((rect) => {
                 ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
              });
         }


        // --- Draw placed pieces (semi-transparent fill) ---
         console.log(`Drawing ${sheet.placedPieces.length} placed pieces for sheet ${index + 1}.`); // Log count
         sheet.placedPieces.forEach(piece => {
             // Pieces are drawn at their calculated coordinates, which already include the margin offset
             ctx.fillStyle = getPieceColor(piece.originalIndex) + '80'; // Add 80 for 50% opacity
             // Use placedWidth and placedHeight for drawing
             ctx.fillRect(piece.x, piece.y, piece.placedWidth, piece.placedHeight);
         });

         // --- Draw piece outlines and text AFTER piece fills ---
         sheet.placedPieces.forEach(piece => {
              // Draw piece outlines for clarity
              ctx.strokeStyle = 'black';
              ctx.lineWidth = 1;
              // Use placedWidth and placedHeight for drawing outline
              ctx.strokeRect(piece.x, piece.y, piece.placedWidth, piece.placedHeight);

              // Add dimension text if piece is large enough
              // Base font size on the *placed* dimensions, with a minimum size
              const minFontSize = 16; // Increased minimum legible font size
              // Scale font size based on the smaller dimension of the placed piece, but cap it
              // Increased scaling factor slightly
              const fontSize = Math.max(minFontSize, Math.min(piece.placedHeight * 0.35, piece.placedWidth * 0.35, 35)); // Increased scaling and max size

               // Display original dimensions (Width x Height)
               const label = `${piece.width}x${piece.height}`;

               // Set font to accurately measure text width and height
               ctx.font = `bold ${fontSize}px Arial`;
               const measuredText = ctx.measureText(label);
               const measuredTextWidth = measuredText.width;
               const measuredTextHeight = measuredText.actualBoundingBoxAscent + measuredText.actualBoundingBoxDescent; // Approximate text height

               // Determine available space for text (always horizontal)
               const availableWidthForText = piece.placedWidth;
               const availableHeightForText = piece.placedHeight;

               // Only draw text if it fits reasonably within the piece dimensions horizontally
               // Allow some padding (e.g., 5% of piece dimension)
               const paddingFactor = 0.05;
               if (measuredTextWidth < availableWidthForText * (1 - paddingFactor * 2) &&
                   measuredTextHeight < availableHeightForText * (1 - paddingFactor * 2))
               {
                   ctx.fillStyle = '#000000'; // Black text color
                   ctx.textAlign = 'center';
                   ctx.textBaseline = 'middle';

                   // Draw the fill text directly
                   ctx.fillText(label, piece.x + piece.placedWidth / 2, piece.y + piece.placedHeight / 2);

               } else {
                    // If the piece is too small for the full "WxH" text, try to fit just "W" and "H" on separate lines if possible
                    const widthLabel = `${piece.width}`;
                    const heightLabel = `${piece.height}`;

                    // Measure width and height labels
                    // Use the same font size as calculated
                    ctx.font = `bold ${fontSize}px Arial`;
                    const measuredWidthLabel = ctx.measureText(widthLabel);
                    const measuredWidthLabelWidth = measuredWidthLabel.width;
                    const measuredHeightLabel = ctx.measureText(heightLabel);
                    const measuredHeightLabelWidth = measuredHeightLabel.width;
                     // Recalculate text height based on current font setting
                    const currentTextHeight = ctx.measureText('M').width; // Use 'M' for a rough height estimate

                    // Check if individual dimensions fit horizontally
                    if (measuredWidthLabelWidth < availableWidthForText * (1 - paddingFactor * 2) &&
                        currentTextHeight * 2 < availableHeightForText * (1 - paddingFactor * 2) && // Check height for two lines
                        measuredHeightLabelWidth < availableWidthForText * (1 - paddingFactor * 2))
                    {
                        ctx.fillStyle = '#000000'; // Black text color
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle'; // Still middle, but we'll adjust Y

                        // Position W and H on separate lines, centered vertically
                        const lineHeight = currentTextHeight * 1.5; // Increased space between lines
                        const startY = piece.y + piece.placedHeight / 2 - lineHeight / 2; // Center vertically

                        ctx.fillText(widthLabel, piece.x + piece.placedWidth / 2, startY);
                        ctx.fillText(heightLabel, piece.x + piece.placedWidth / 2, startY + lineHeight);

                    }
                    // Optional: Log which pieces are too small for any text
                    // else {
                    //     console.log(`Piece ${piece.id} (${piece.width}x${piece.height}) is too small for any text.`);
                    // }
               }
         });
         console.log(`Finished drawing sheet ${index + 1}.`); // Log sheet finish
    });
     console.log('All sheets drawn.'); // Log finish
}

// Assigns a consistent color to pieces from the same original input row.
const pieceColorCache = {};
// Palette of light gray shades
const colorPalette = [
    '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0', '#b0b0b0',
    '#f5f5f5', '#ebebeb', '#dcdcdc', '#cccccc', '#b8b8b8'
];

/**
 * Gets a consistent color for a piece based on its original input index.
 * @param {number} originalIndex The index of the piece definition in the input list.
 * @returns {string} A hex color string.
 */
function getPieceColor(originalIndex) {
    if (pieceColorCache[originalIndex]) {
        return pieceColorCache[originalIndex];
    }
    const color = colorPalette[originalIndex % colorPalette.length];
    pieceColorCache[originalIndex] = color;
    return color;
}