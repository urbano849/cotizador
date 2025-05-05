        // ======================================================================
        // Tab Switching Logic
        // ======================================================================

        /**
         * Opens the specified tab and hides others.
         * @param {Event} event The click event.
         * @param {string} tabId The ID of the tab content to show.
         */
        function openTab(event, tabId) {
            console.log(`openTab called with tabId: ${tabId}`);
            // Declare all tab content elements
            var tabContents = document.getElementsByClassName("tab-content");
            for (var i = 0; i < tabContents.length; i++) {
                tabContents[i].style.display = "none";
                tabContents[i].classList.remove("active"); // Remove active class
            }

            // Declare all tab buttons
            var tabButtons = document.getElementsByClassName("tab-button");
            for (var i = 0; i < tabButtons.length; i++) {
                tabButtons[i].classList.remove("active"); // Remove active class
            }

            // Show the specific tab content
            const activeTabContent = document.getElementById(tabId);
            if (activeTabContent) {
                activeTabContent.style.display = "block";
                activeTabContent.classList.add("active"); // Add active class
            } else {
                 console.error(`Tab content with ID "${tabId}" not found.`);
            }


            // Add the "active" class to the button that opened the tab
            if (event && event.currentTarget) {
                event.currentTarget.classList.add("active");
            } else {
                 console.warn("Event or event.currentTarget is null in openTab.");
            }


            // Optional: Trigger initialization or update for the activated tab
            if (tabId === 'cotizador') {
                 console.log("Switched to Cotizador tab.");
                 // Add any cotizador-specific initialization/update calls here if needed on tab switch
                 actualizarListaMuebles(); // Ensure the cotizador list is updated when switching to its tab
                 actualizarListaCotizacionesGuardadas(); // Ensure saved quotes are updated
            } else if (tabId === 'optimizador') {
                 console.log("Switched to Optimizador tab.");
                 // Add any optimizador-specific initialization/update calls here if needed on tab switch
                 // The drawing in optimizador is triggered by the optimizeCuts button click,
                 // but you might want to clear or show initial state here.
            }
        }


        // ======================================================================
        // Shared Functionality
        // ======================================================================

         /**
         * Displays a message to the user in a styled box.
         * @param {string} message The text to display.
         * @param {string} type 'error' or 'success'/'info'.
         * @param {number} duration Time in ms to show the message.
         */
        function showMessage(message, type = 'error', duration = 3000) {
            console.log(`showMessage called: ${message} (${type})`);
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
          * Formats a date object as YYYY-MM-DD.
          * @param {Date} date The date object to format.
          * @returns {string} The formatted date string.
          */
         function formatDate(date) {
             const day = date.getDate().toString().padStart(2, '0');
             const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() es base 0
             const year = date.getFullYear();
             return `${year}-${month}-${day}`;
         }


        // ======================================================================
        // Cotizador Functionality
        // ======================================================================

        // Base de datos de materiales con sus precios (se inicializará con IndexedDB si hay datos guardados)
        let materiales = {
            tableros: {
                "melamina_blanca_18mm": { nombre: "Melamina Blanca 18mm", precio: 5192.00 },
                "melamina_blanca_15mm": { nombre: "Melamina Blanca 15mm", precio: 4531.20 },
                "melamina_blanca_6mm": { nombre: "Melamina Blanca 6mm", precio: 3065.64 },
                "melamina_ceniza_18mm": { nombre: "Melamina ceniza 18mm", precio: 6230.40 }
            },
             // Sección para cantos
            cantos: {
                 "canto_blanco_22mm": { nombre: "Canto blanco 22mm", precio: 10.00 },
            },
            herrajes: {
                correderas: {
                    "tandem_300mm": { nombre: "Tandem 300mm", precio: 600 },
                    "tandem_350mm": { nombre: "Tandem 350mm", precio: 650 },
                    "tandem_400mm": { nombre: "Tandem 400mm", precio: 700 },
                    "tandem_450mm": { nombre: "Tandem 450mm", precio: 750 },
                    "tandem_500mm": { nombre: "Tandem 500mm", precio: 800 },
                    "metabox_400mm": { nombre: "Metabox 400mm", precio: 750 },
                    "metabox_450mm": { nombre: "Metabox 450mm", precio: 850 },
                    "metabox_500mm": { nombre: "Metabox 500mm", precio: 1000 }
                },
                bisagras: {
                    "montaje_interior": { nombre: "Montaje Interior", precio: 300 },
                    "montaje_exterior": { nombre: "Montaje Exterior", precio: 350 }
                },
                tiradores: {
                    "tirador_90mm": { nombre: "Tirador 90mm", precio: 60 },
                    "tirador_120mm": { nombre: "Tirador 120mm", precio: 80 },
                    "clicatto": { nombre: "Clicatto", precio: 1300 },
                    "gola": { nombre: "Gola", precio: 1500 }
                },
                // Todos los herrajes que no son correderas, bisagras o tiradores se agrupan aquí
                otros: {
                    "enganche_aereo": { nombre: "Enganche Aéreo", precio: 90 },
                    "enganche_base": { nombre: "Enganche Base", precio: 150 },
                    "zocalo": { nombre: "Zócalo", precio: 1200 },
                    "barra_closet": { nombre: "Barra de Closet", precio: 1500 },
                    "patas": { nombre: "Patas", precio: 45 },
                    "esquineros": { nombre: "Esquineros", precio: 50 },
                    "gancho_patas": { nombre: "Gancho Patas", precio: 25 }
                }
            }
        };

        // Información de la empresa (predefinida)
        const infoEmpresa = {
            nombre: "VARGAS ARQUITECTOS",
            direccion: "Calle 9, no.22 Villa Carmen, Santo Domingo Este.",
            telefono: "(829) 613-8006",
            email: "arq.jesusvargas01@gmail.com",
            logoUrl: "[https://i.postimg.cc/y6wLjccb/Captura-de-pantalla-2025-04-24-133337.png](https://i.postimg.cc/y6wLjccb/Captura-de-pantalla-2025-04-24-133337.png)" // URL del logo proporcionada
        };

        // Array para almacenar los muebles agregados (cotización actual)
        let muebles = [];

        // Array para almacenar las cotizaciones guardadas (se cargará desde IndexedDB)
        let cotizacionesGuardadas = [];

        // Variable para la base de datos IndexedDB
        let db;
        const dbName = 'CotizadorDB';
        const dbVersion = 1; // Incrementar si cambias la estructura de los almacenes

        // Nombres de los Object Stores
        const preciosStoreName = 'preciosMateriales';
        const cotizacionesStoreName = 'cotizacionesGuardadas';

         // IndexedDB: Open or create the database
        function openDatabase() {
            console.log('Cotizador IndexedDB: Attempting to open or create database...');
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, dbVersion);

                request.onupgradeneeded = function(event) {
                    db = event.target.result;
                    console.log('Cotizador IndexedDB: Upgrading or creating database...');
                    if (!db.objectStoreNames.contains(preciosStoreName)) {
                        db.createObjectStore(preciosStoreName, { keyPath: 'id' });
                        console.log(`Cotizador IndexedDB: Object store "${preciosStoreName}" created.`);
                    }
                    if (!db.objectStoreNames.contains(cotizacionesStoreName)) {
                        const cotizacionesStore = db.createObjectStore(cotizacionesStoreName, { keyPath: 'id' });
                        cotizacionesStore.createIndex('nombreCliente', 'nombreCliente', { unique: false });
                        console.log(`Cotizador IndexedDB: Object store "${cotizacionesStoreName}" created with index.`);
                    }
                };

                request.onsuccess = function(event) {
                    db = event.target.result;
                    console.log('Cotizador IndexedDB: Database opened successfully.');
                    resolve(db);
                };

                request.onerror = function(event) {
                    console.error('Cotizador IndexedDB: Error opening database:', event.target.error);
                    reject(event.target.error);
                };
            });
        }

        // IndexedDB: Get data from a store
        function getDataFromStore(storeName) {
            console.log(`Attempting to get data from store: ${storeName}`);
            return new Promise((resolve, reject) => {
                if (!db) { console.error('IndexedDB not initialized.'); reject('IndexedDB not initialized.'); return; }
                const transaction = db.transaction([storeName], 'readonly');
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.getAll();
                request.onsuccess = (event) => { console.log(`Data from ${storeName}:`, event.target.result); resolve(event.target.result); };
                request.onerror = (event) => { console.error(`Error getting data from ${storeName}:`, event.target.error); reject(event.target.error); };
            });
        }

         // IndexedDB: Get a specific object by keyPath (id)
         function getObjectFromStore(storeName, id) {
             console.log(`Attempting to get object id ${id} from store: ${storeName}`);
             return new Promise((resolve, reject) => {
                 if (!db) { console.error('IndexedDB not initialized.'); reject('IndexedDB not initialized.'); return; }
                 const transaction = db.transaction([storeName], 'readonly');
                 const objectStore = transaction.objectStore(storeName);
                 const request = objectStore.get(id);
                 request.onsuccess = (event) => { console.log(`Object id ${id} from ${storeName}:`, event.target.result); resolve(event.target.result); };
                 request.onerror = (event) => { console.error(`Error getting object id ${id} from ${storeName}:`, event.target.error); reject(event.target.error); };
             });
         }


        // IndexedDB: Add or update data in a store
        function putDataInStore(storeName, data) {
            console.log(`Attempting to put data in store: ${storeName}`, data);
            return new Promise((resolve, reject) => {
                if (!db) { console.error('IndexedDB not initialized.'); reject('IndexedDB not initialized.'); return; }
                const transaction = db.transaction([storeName], 'readwrite');
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.put(data);
                request.onsuccess = (event) => { console.log(`Data put successfully in ${storeName}. Key:`, event.target.result); resolve(event.target.result); };
                request.onerror = (event) => { console.error(`Error putting data in ${storeName}:`, event.target.error); reject(event.target.error); };
            });
        }

        // IndexedDB: Delete data from a store
        function deleteDataFromStore(storeName, id) {
            console.log(`Attempting to delete data id ${id} from store: ${storeName}`);
            return new Promise((resolve, reject) => {
                if (!db) { console.error('IndexedDB not initialized.'); reject('IndexedDB not initialized.'); return; }
                const transaction = db.transaction([storeName], 'readwrite');
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.delete(id);
                request.onsuccess = (event) => { console.log(`Data id ${id} deleted successfully from ${storeName}.`); resolve(); };
                request.onerror = (event) => { console.error(`Error deleting data id ${id} from ${storeName}:`, event.target.error); reject(event.target.error); };
            });
        }

         // IndexedDB: Clear a store
         function clearStore(storeName) {
             console.log(`Attempting to clear store: ${storeName}`);
             return new Promise((resolve, reject) => {
                 if (!db) { console.error('IndexedDB not initialized.'); reject('IndexedDB not initialized.'); return; }
                 const transaction = db.transaction([storeName], 'readwrite');
                 const objectStore = transaction.objectStore(storeName);
                 const request = objectStore.clear();
                 request.onsuccess = (event) => { console.log(`Store ${storeName} cleared successfully.`); resolve(); };
                 request.onerror = (event) => { console.error(`Error clearing store ${storeName}:`, event.target.error); reject(event.target.error); };
             });
         }


        // Cotizador: Calculate base cost (materials only)
        function calcularCostoBaseMueble(mueble) {
            let costoMateriales = 0;
             for (const tablero of mueble.tableros) {
                  if (tablero.tipo && materiales.tableros[tablero.tipo]) {
                      costoMateriales += tablero.cantidad * materiales.tableros[tablero.tipo].precio;
                  } else if (tablero.nombre && tablero.precio !== undefined) {
                      costoMateriales += tablero.cantidad * tablero.precio;
                  }
             }
             for (const canto of mueble.cantos) {
                 if (canto.tipo && materiales.cantos[canto.tipo]) {
                     costoMateriales += canto.cantidad * materiales.cantos[canto.tipo].precio;
                 } else if (canto.nombre && canto.precio !== undefined) {
                     costoMateriales += canto.cantidad * canto.precio;
                 }
             }
             for (const herraje of mueble.herrajes) {
                 const categoria = herraje.categoria;
                 if (herraje.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][herraje.tipo]) {
                     costoMateriales += herraje.cantidad * materiales.herrajes[categoria][herraje.tipo].precio;
                 } else if (herraje.nombre && herraje.precio !== undefined) {
                     costoMateriales += herraje.cantidad * herraje.precio;
                 }
             }
            return costoMateriales;
        }

        // Cotizador: Calculate unit cost (with profit, without total quantity)
        function calcularCostoUnitarioMueble(mueble, porcentajeGanancia) {
            const costoBaseMateriales = calcularCostoBaseMueble(mueble);
            const costoConAdicionales = costoBaseMateriales + (mueble.transporte || 0) + (mueble.instalacion || 0);
            return costoConAdicionales * (1 + porcentajeGanancia / 100);
        }

        // Cotizador: Calculate total cost for a mueble (unit * quantity)
        function calcularImporteMueble(mueble, porcentajeGanancia) {
            const costoUnitario = calcularCostoUnitarioMueble(mueble, porcentajeGanancia);
            return costoUnitario * mueble.cantidad;
        }

        // Cotizador: Consolidate materials list for all muebles
        function consolidarMateriales(mueblesArray) {
            const materialesConsolidados = { tableros: {}, cantos: {}, herrajes: {} };
            mueblesArray.forEach(mueble => {
                 mueble.tableros.forEach(tablero => {
                     const key = tablero.tipo || `custom_${tablero.nombre}`;
                     const nombre = tablero.tipo && materiales.tableros[tablero.tipo] ? materiales.tableros[tablero.tipo].nombre : tablero.nombre;
                     const precio = tablero.tipo && materiales.tableros[tablero.tipo] ? materiales.tableros[tablero.tipo].precio : tablero.precio;
                     if (!materialesConsolidados.tableros[key]) materialesConsolidados.tableros[key] = { nombre: nombre, precio: precio, cantidad: 0 };
                     materialesConsolidados.tableros[key].cantidad += tablero.cantidad * mueble.cantidad;
                 });
                 mueble.cantos.forEach(canto => {
                      const key = canto.tipo || `custom_${canto.nombre}`;
                      const nombre = canto.tipo && materiales.cantos[canto.tipo] ? materiales.cantos[canto.tipo].nombre : canto.nombre;
                      const precio = canto.tipo && materiales.cantos[canto.tipo] ? materiales.cantos[canto.tipo].precio : canto.precio;
                      if (!materialesConsolidados.cantos[key]) materialesConsolidados.cantos[key] = { nombre: nombre, precio: precio, cantidad: 0 };
                      materialesConsolidados.cantos[key].cantidad += canto.cantidad * mueble.cantidad;
                 });
                 mueble.herrajes.forEach(herraje => {
                     const categoria = herraje.categoria || 'otros';
                     const key = herraje.tipo || `custom_${herraje.nombre}`;
                     const nombre = herraje.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][herraje.tipo] ? materiales.herrajes[categoria][herraje.tipo].nombre : herraje.nombre;
                     const precio = herraje.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][herraje.tipo] ? materiales.herrajes[categoria][herraje.tipo].precio : herraje.precio;
                     if (!materialesConsolidados.herrajes[categoria]) materialesConsolidados.herrajes[categoria] = {};
                     if (!materialesConsolidados.herrajes[categoria][key]) materialesConsolidados.herrajes[categoria][key] = { nombre: nombre, precio: precio, cantidad: 0 };
                     materialesConsolidados.herrajes[categoria][key].cantidad += herraje.cantidad * mueble.cantidad;
                 });
            });
            return materialesConsolidados;
        }

        /**
         * Adds a new Tablero item input row to the UI.
         * @param {object} [itemData=null] Optional data to pre-fill the row (for editing).
         */
        function agregarTableroItem(itemData = null) {
            console.log("Adding Tablero item with data:", itemData);
            const container = document.getElementById('current-mueble-tableros-container');
            if (!container) { console.error("Tableros container not found."); return; }
            const div = document.createElement('div');
            div.className = 'herraje-item flex items-center gap-2 mb-3';
            let selectHtml = `<select onchange="toggleCustomMaterialInputs(this, 'tablero')" class="flex-grow p-2 border border-gray-300 rounded-md">`;
            selectHtml += `<option value="">-- Seleccionar Tablero --</option>`;
            for (const [id, item] of Object.entries(materiales.tableros)) {
                selectHtml += `<option value="${id}">${item.nombre} ($${materiales.tableros[id].precio.toFixed(2)})</option>`;
            }
            selectHtml += `<option value="custom">Otro</option>`; // Changed text here
            selectHtml += '</select>';
            div.innerHTML = `
                ${selectHtml}
                <input type="number" min="0" step="1" value="0" placeholder="Cantidad" class="w-24 p-2 border border-gray-300 rounded-md text-center">
                <button class="btn-delete bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" onclick="this.parentElement.remove()">×</button>
                <div class="custom-material-inputs">
                    <input type="text" class="custom-nombre p-2 border border-gray-300 rounded-md" placeholder="Nombre">
                    <input type="number" class="custom-precio p-2 border border-gray-300 rounded-md" min="0" step="0.01" value="0" placeholder="Precio Unitario">
                    <input type="number" class="custom-cantidad p-2 border border-gray-300 rounded-md" min="0" step="1" value="0" placeholder="Cantidad">
                </div>
            `;
             container.appendChild(div); // Append first

             // Now handle itemData if provided
             if (itemData) {
                 const selectElement = div.querySelector('select');
                 const cantidadInput = div.querySelector('input[type="number"]');
                 const customInputsDiv = div.querySelector('.custom-material-inputs');
                 const customNombreInput = customInputsDiv.querySelector('.custom-nombre');
                 const customPrecioInput = customInputsDiv.querySelector('.custom-precio');
                 const customCantidadInput = customInputsDiv.querySelector('.custom-cantidad');

                 if (itemData.tipo && materiales.tableros[itemData.tipo]) {
                      console.log("Loading standard Tablero item:", itemData);
                      selectElement.value = itemData.tipo;
                      cantidadInput.value = itemData.cantidad;
                      // No need to call toggleCustomMaterialInputs here if it's hidden by default CSS
                 } else if (itemData.nombre && itemData.precio !== undefined) {
                      console.log("Loading custom Tablero item:", itemData);
                      selectElement.value = 'custom';
                      customNombreInput.value = itemData.nombre;
                      customPrecioInput.value = itemData.precio;
                      customCantidadInput.value = itemData.cantidad;
                      toggleCustomMaterialInputs(selectElement, 'tablero'); // Call to show custom inputs
                 } else {
                      // Handle case where itemData is invalid or doesn't match
                      console.warn("Invalid itemData provided for Tablero:", itemData);
                       // Keep default empty state, custom inputs remain hidden
                 }
             }
             // Ensure initial state is correct for newly added empty rows
             const selectElement = div.querySelector('select');
             if (selectElement) {
                 toggleCustomMaterialInputs(selectElement, 'tablero');
             }
        }

         /**
          * Adds a new Canto item input row to the UI.
          * @param {object} [itemData=null] Optional data to pre-fill the row (for editing).
          */
         function agregarCantoItem(itemData = null) {
             console.log("Adding Canto item with data:", itemData);
             const container = document.getElementById('current-mueble-cantos-container');
             if (!container) { console.error("Cantos container not found."); return; }
             const div = document.createElement('div');
             div.className = 'herraje-item flex items-center gap-2 mb-3';
             div.innerHTML = `
                 <select onchange="toggleCustomMaterialInputs(this, 'canto')" class="flex-grow p-2 border border-gray-300 rounded-md">
                     <option value="">-- Seleccionar Canto --</option>
                     ${Object.entries(materiales.cantos).map(([id, item]) =>
                         `<option value="${id}">${item.nombre} ($${materiales.cantos[id].precio.toFixed(2)})</option>`
                     ).join('')}
                     <option value="custom">Otro</option> </select>
                 <input type="number" min="0" step="0.1" value="0" placeholder="Metros Lineales" class="w-24 p-2 border border-gray-300 rounded-md text-center">
                 <button class="btn-delete bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" onclick="this.parentElement.remove()">×</button>
                 <div class="custom-material-inputs">
                     <input type="text" class="custom-nombre p-2 border border-gray-300 rounded-md" placeholder="Nombre">
                     <input type="number" class="custom-precio p-2 border border-gray-300 rounded-md" min="0" step="0.01" value="0" placeholder="Precio Unitario">
                     <input type="number" class="custom-cantidad p-2 border border-gray-300 rounded-md" min="0" step="0.1" value="0" placeholder="Cantidad">
                 </div>
             `;
             container.appendChild(div); // Append first

             // Now handle itemData if provided
             if (itemData) {
                 const selectElement = div.querySelector('select');
                 const cantidadInput = div.querySelector('input[type="number"]');
                 const customInputsDiv = div.querySelector('.custom-material-inputs');
                 const customNombreInput = customInputsDiv.querySelector('.custom-nombre');
                 const customPrecioInput = customInputsDiv.querySelector('.custom-precio');
                 const customCantidadInput = customInputsDiv.querySelector('.custom-cantidad');

                 if (itemData.tipo && materiales.cantos[itemData.tipo]) {
                      console.log("Loading standard Canto item:", itemData);
                      selectElement.value = itemData.tipo;
                      cantidadInput.value = itemData.cantidad;
                      // No need to call toggleCustomMaterialInputs here if it's hidden by default CSS
                 } else if (itemData.nombre && itemData.precio !== undefined) {
                      console.log("Loading custom Canto item:", itemData);
                      selectElement.value = 'custom';
                      customNombreInput.value = itemData.nombre;
                      customPrecioInput.value = itemData.precio;
                      customCantidadInput.value = itemData.cantidad;
                      toggleCustomMaterialInputs(selectElement, 'canto'); // Call to show custom inputs
                 } else {
                      // Handle case where itemData is invalid or doesn't match
                      console.warn("Invalid itemData provided for Canto:", itemData);
                       // Keep default empty state, custom inputs remain hidden
                 }
             }
              // Ensure initial state is correct for newly added empty rows
             const selectElement = div.querySelector('select');
             if (selectElement) {
                 toggleCustomMaterialInputs(selectElement, 'canto');
             }
         }


        /**
         * Adds a new Herraje item input row to the UI for a specific category.
         * @param {string} categoria The category of the herraje (e.g., 'correderas', 'bisagras').
         * @param {object} [itemData=null] Optional data to pre-fill the row (for editing).
         */
        function agregarHerrajeItem(categoria, itemData = null) {
            console.log(`Adding Herraje item (${categoria}) with data:`, itemData);
            const containerId = `current-mueble-${categoria}-container`;
            const container = document.getElementById(containerId);
            if (!container) { console.error(`Herraje container for category ${categoria} not found.`); return; }
            const div = document.createElement('div');
            div.className = 'herraje-item flex items-center gap-2 mb-3';
            div.innerHTML = `
                <select onchange="toggleCustomMaterialInputs(this, 'herraje')" class="flex-grow p-2 border border-gray-300 rounded-md">
                    <option value="">-- Seleccionar Herraje --</option>
                    ${Object.entries(materiales.herrajes[categoria] || {}).map(([id, item]) =>
                        `<option value="${id}">${item.nombre} ($${materiales.herrajes[categoria][id].precio.toFixed(2)})</option>`
                    ).join('')}
                    <option value="custom">Otro</option> </select>
                <input type="number" min="0" step="1" value="0" placeholder="Cantidad" class="w-24 p-2 border border-gray-300 rounded-md text-center">
                <button class="btn-delete bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" onclick="this.parentElement.remove()">×</button>
                 <div class="custom-material-inputs">
                     <input type="text" class="custom-nombre p-2 border border-gray-300 rounded-md" placeholder="Nombre">
                     <input type="number" class="custom-precio p-2 border border-gray-300 rounded-md" min="0" step="0.01" value="0" placeholder="Precio Unitario">
                     <input type="number" class="custom-cantidad p-2 border border-gray-300 rounded-md" min="0" step="1" value="0" placeholder="Cantidad">
                 </div>
            `;
             container.appendChild(div); // Append first

             // Now handle itemData if provided
             if (itemData) {
                 const selectElement = div.querySelector('select');
                 const cantidadInput = div.querySelector('input[type="number"]');
                 const customInputsDiv = div.querySelector('.custom-material-inputs');
                 const customNombreInput = customInputsDiv.querySelector('.custom-nombre');
                 const customPrecioInput = customInputsDiv.querySelector('.custom-precio');
                 const customCantidadInput = customInputsDiv.querySelector('.custom-cantidad');

                 if (itemData.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][itemData.tipo]) {
                      console.log(`Loading standard Herraje item (${categoria}):`, itemData);
                      selectElement.value = itemData.tipo;
                      cantidadInput.value = itemData.cantidad;
                      // No need to call toggleCustomMaterialInputs here if it's hidden by default CSS
                 } else if (itemData.nombre && itemData.precio !== undefined) {
                      console.log(`Loading custom Herraje item (${categoria}):`, itemData);
                      selectElement.value = 'custom';
                      customNombreInput.value = itemData.nombre;
                      customPrecioInput.value = itemData.precio;
                      customCantidadInput.value = itemData.cantidad;
                      toggleCustomMaterialInputs(selectElement, 'herraje'); // Call to show custom inputs
                 } else {
                      // Handle case where itemData is invalid or doesn't match
                      console.warn(`Invalid itemData provided for Herraje (${categoria}):`, itemData);
                       // Keep default empty state, custom inputs remain hidden
                 }
             }
              // Ensure initial state is correct for newly added empty rows
             const selectElement = div.querySelector('select');
             if (selectElement) {
                 toggleCustomMaterialInputs(selectElement, 'herraje');
             }
        }

        /**
         * Toggles the visibility of custom material input fields based on the select value.
         * @param {HTMLSelectElement} selectElement The select element that triggered the change.
         * @param {string} tipoMaterial The type of material ('tablero', 'canto', 'herraje').
         */
        function toggleCustomMaterialInputs(selectElement, tipoMaterial) {
            console.log(`Toggling custom inputs for ${tipoMaterial}. Selected value: ${selectElement.value}`);
            const parentDiv = selectElement.parentElement;
            const cantidadInput = parentDiv.querySelector('input[type="number"]'); // This is the standard quantity input
            const customInputsDiv = parentDiv.querySelector('.custom-material-inputs'); // This is the container for custom inputs

            if (!cantidadInput || !customInputsDiv) {
                console.error("Required inputs/containers not found for toggleCustomMaterialInputs.");
                return;
            }


            if (selectElement.value === 'custom') {
                customInputsDiv.style.display = 'flex'; // Use flex here
                cantidadInput.style.display = 'none';
                console.log("Switched to custom input display.");
            } else {
                customInputsDiv.style.display = 'none';
                cantidadInput.style.display = 'block'; // Use block here
                 // Clear custom fields when switching back to a standard material
                 const customNombreInput = customInputsDiv.querySelector('.custom-nombre');
                 const customPrecioInput = customInputsDiv.querySelector('.custom-precio');
                 const customCantidadInput = customInputsDiv.querySelector('.custom-cantidad');
                 if(customNombreInput) customNombreInput.value = '';
                 if(customPrecioInput) customPrecioInput.value = '0';
                 if(customCantidadInput) customCantidadInput.value = '0';
                console.log("Switched to standard input display.");
            }
        }

        /**
         * Updates the list of quoted muebles displayed in the UI.
         */
        function actualizarListaMuebles() {
            console.log("Updating Muebles list...");
            const listaMuebles = document.getElementById('lista-muebles');
            const gananciaInput = document.getElementById('ganancia');
            const porcentajeGanancia = gananciaInput ? parseFloat(gananciaInput.value) || 0 : 0;
            const descuentoInput = document.getElementById('descuento');
            const porcentajeDescuento = descuentoInput ? parseFloat(descuentoInput.value) || 0 : 0;

            if (!listaMuebles) {
                 console.error("Muebles list element not found.");
                 return;
            }

            listaMuebles.innerHTML = '';

            if (muebles.length === 0) {
                listaMuebles.innerHTML = '<p class="text-gray-600">No hay muebles agregados</p>';
                document.getElementById('total-cotizacion').textContent = '$0.00';
                const materialsSection = document.getElementById('materials-list-section');
                if(materialsSection) materialsSection.style.display = 'none';
                console.log("Muebles list is empty.");
                return;
            }

            let totalCotizacion = 0;
            muebles.forEach((mueble, index) => {
                const importeEsteMueble = calcularImporteMueble(mueble, porcentajeGanancia);
                totalCotizacion += importeEsteMueble;

                let tablerosUsados = [];
                for (const tablero of mueble.tableros) {
                    if (tablero.cantidad > 0) {
                         let nombreMaterial = tablero.tipo && materiales.tableros[tablero.tipo] ? materiales.tableros[tablero.tipo].nombre : `${tablero.nombre} (Personalizado)`;
                         let precioUnitario = tablero.tipo && materiales.tableros[tablero.tipo] ? materiales.tableros[tablero.tipo].precio : tablero.precio;
                         tablerosUsados.push(`${tablero.cantidad} de ${nombreMaterial} ($${precioUnitario.toFixed(2)})`);
                    }
                }

                 let cantosUsados = [];
                 for (const canto of mueble.cantos) {
                      if (canto.cantidad > 0) {
                          let nombreMaterial = canto.tipo && materiales.cantos[canto.tipo] ? materiales.cantos[canto.tipo].nombre : `${canto.nombre} (Personalizado)`;
                          let precioUnitario = canto.tipo && materiales.cantos[canto.tipo] ? materiales.cantos[canto.tipo].precio : canto.precio;
                          cantosUsados.push(`${canto.cantidad.toFixed(2)} ML ${nombreMaterial} ($${precioUnitario.toFixed(2)})`);
                      }
                 }

                let herrajesUsados = [];
                for (const herraje of mueble.herrajes) {
                     const categoria = herraje.categoria;
                     if (herraje.cantidad > 0) {
                         let nombreMaterial = herraje.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][herraje.tipo] ? materiales.herrajes[categoria][herraje.tipo].nombre : `${herraje.nombre} (Personalizado)`;
                         let precioUnitario = herraje.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][herraje.tipo] ? materiales.herrajes[categoria][herraje.tipo].precio : herraje.precio;
                          herrajesUsados.push(`${herraje.cantidad} ${nombreMaterial} ($${precioUnitario.toFixed(2)})`);
                     }
                }

                let costosAdicionalesHtml = '';
                if (mueble.transporte > 0) {
                    costosAdicionalesHtml += `<p class="text-gray-700"><strong>Costo de Transporte:</strong> $${mueble.transporte.toFixed(2)}</p>`;
                }
                 if (mueble.instalacion > 0) {
                    costosAdicionalesHtml += `<p class="text-gray-700"><strong>Costo de Instalación:</strong> $${mueble.instalacion.toFixed(2)}</p>`;
                 }

                const muebleElement = document.createElement('div');
                muebleElement.className = 'mueble-item border border-gray-300 p-5 mb-5 rounded-lg bg-gray-50 relative shadow-sm';
                muebleElement.innerHTML = `
                    <h3 class="text-xl font-semibold text-blue-700 mb-2">${mueble.nombre} (x${mueble.cantidad})</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p class="text-gray-700"><strong>Tableros:</strong> ${tablerosUsados.join(', ') || 'Ninguno'}</p>
                        <p class="text-gray-700"><strong>Cantos:</strong> ${cantosUsados.join(', ') || 'Ninguno'}</p>
                        <p class="text-gray-700 md:col-span-2"><strong>Herrajes:</strong> ${herrajesUsados.join(', ') || 'Ninguno'}</p>
                        ${costosAdicionalesHtml ? `<div class="md:col-span-2">${costosAdicionalesHtml}</div>` : ''}
                    </div>
                    <p class="text-lg font-bold text-green-700 mt-3 text-right">Precio por ${mueble.cantidad} unidad(es): $${importeEsteMueble.toFixed(2)}</p>
                    <div class="absolute top-4 right-4 flex space-x-2"> <button class="btn-edit bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded" data-index="${index}" onclick="editarMueble(${index})">Editar</button> <button class="btn-delete bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded" data-index="${index}" onclick="eliminarMueble(${index})">Eliminar</button>
                    </div>
                `;
                listaMuebles.appendChild(muebleElement);
            });

            const subtotal = totalCotizacion;
            const montoDescuento = subtotal * (porcentajeDescuento / 100);
            const totalConDescuento = subtotal - montoDescuento;
            document.getElementById('total-cotizacion').textContent = `$${totalConDescuento.toFixed(2)}`;
            console.log("Muebles list updated. Total:", totalConDescuento.toFixed(2));
        }

        /**
         * Deletes a mueble from the current quote list.
         * @param {number} index The index of the mueble to delete.
         */
        function eliminarMueble(index) {
            console.log("Attempting to delete mueble at index:", index);
            if (index >= 0 && index < muebles.length) {
                 muebles.splice(index, 1);
                 actualizarListaMuebles();
                 if (muebles.length === 0) {
                      const materialsSection = document.getElementById('materials-list-section');
                     if(materialsSection) materialsSection.style.display = 'none';
                 }
                 showMessage('Mueble eliminado.', 'success');
                 console.log("Mueble deleted successfully.");
            } else {
                 console.error("Invalid index for deleting mueble:", index);
                 showMessage('Error al eliminar mueble.', 'error');
            }
        }

         /**
          * Loads a mueble into the input form for editing.
          * @param {number} index The index of the mueble to edit.
          */
         function editarMueble(index) {
              console.log("Attempting to edit mueble at index:", index);
              const muebleToEdit = muebles[index];
              if (!muebleToEdit) {
                  console.error("Mueble a editar no encontrado:", index);
                  showMessage('Error al cargar mueble para edición.', 'error');
                  return;
              }
              document.getElementById('nombre').value = muebleToEdit.nombre;
              document.getElementById('cantidad-mueble').value = muebleToEdit.cantidad;
              document.getElementById('cotizador-costo-transporte').value = muebleToEdit.transporte || 0; // Corrected ID
              document.getElementById('cotizador-costo-instalacion').value = muebleToEdit.instalacion || 0; // Corrected ID

              // Clear current dynamic items before adding the ones from the mueble
              document.querySelectorAll('.current-mueble-section .dynamic-items-container').forEach(container => { container.innerHTML = ''; });

              // Add items from the mueble being edited
              muebleToEdit.tableros.forEach(tablero => agregarTableroItem(tablero));
              muebleToEdit.cantos.forEach(canto => agregarCantoItem(canto));

              const herrajesByCategory = { correderas: [], bisagras: [], tiradores: [], otros: [] };
              muebleToEdit.herrajes.forEach(herraje => {
                  const category = herraje.categoria || 'otros';
                  if (herrajesByCategory[category]) herrajesByCategory[category].push(herraje);
                  else herrajesByCategory['otros'].push(herraje);
              });

              for (const category in herrajesByCategory) {
                  herrajesByCategory[category].forEach(herraje => agregarHerrajeItem(category, herraje));
              }

              // Add one empty row for each type/category to allow adding new items immediately
              agregarTableroItem();
              agregarCantoItem();
              agregarHerrajeItem('correderas');
              agregarHerrajeItem('bisagras');
              agregarHerrajeItem('tiradores');
              agregarHerrajeItem('otros');


              muebles.splice(index, 1);
              actualizarListaMuebles();
              document.getElementById('nombre').scrollIntoView({ behavior: 'smooth' });
              showMessage('Mueble cargado para edición.', 'success');
              console.log("Mueble loaded for editing.");
          }


        /**
         * Displays the modal form for updating material prices.
         */
        function mostrarFormularioPrecios() {
            console.log("Showing price update form.");
            const dialogo = document.getElementById('dialogo-precios');
            if (!dialogo) {
                console.error("Price dialog element not found.");
                return;
            }
            let html = '<div class="dialogo-contenido bg-white p-8 rounded-lg shadow-xl max-w-2xl max-h-screen overflow-y-auto">';
            html += '<h2 class="text-2xl font-bold text-green-600 mb-5 border-b-2 border-green-500 pb-2">Actualizar Precios Base</h2>';

            html += '<h3 class="text-lg font-semibold text-gray-700 mt-5 mb-3">Tableros</h3>';
            for (const [id, tablero] of Object.entries(materiales.tableros)) {
                html += `<div class="precio-item grid grid-cols-2 gap-4 items-center mb-3"><label class="block text-gray-700">${tablero.nombre}</label><input type="number" step="0.01" id="precio-tablero-${id}" value="${materiales.tableros[id].precio.toFixed(2)}" class="p-2 border border-gray-300 rounded-md w-full"></div>`;
            }
             html += '<h3 class="text-lg font-semibold text-gray-700 mt-5 mb-3">Cantos</h3>';
             for (const [id, canto] of Object.entries(materiales.cantos)) {
                 html += `<div class="precio-item grid grid-cols-2 gap-4 items-center mb-3"><label class="block text-gray-700">${canto.nombre}</label><input type="number" step="0.01" id="precio-canto-${id}" value="${materiales.cantos[id].precio.toFixed(2)}" class="p-2 border border-gray-300 rounded-md w-full"></div>`;
             }
            for (const [categoria, herrajes] of Object.entries(materiales.herrajes)) {
                html += `<h3 class="text-lg font-semibold text-gray-700 mt-5 mb-3">${categoria.charAt(0).toUpperCase() + categoria.slice(1)}</h3>`;
                for (const [id, herraje] of Object.entries(herrajes)) {
                    html += `<div class="precio-item grid grid-cols-2 gap-4 items-center mb-3"><label class="block text-gray-700">${herraje.nombre}</label><input type="number" step="0.01" id="precio-${categoria}-${id}" value="${materiales.herrajes[categoria][id].precio.toFixed(2)}" class="p-2 border border-gray-300 rounded-md w-full"></div>`;
                }
            }

            html += '<button id="btn-guardar-precios" class="btn-primary btn-material bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-6">Guardar Precios</button>';
            html += '<button id="btn-cerrar-dialogo" class="btn-delete btn-material bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ml-4">Cerrar</button>';
            html += '</div>';

            dialogo.innerHTML = html;
            dialogo.style.display = 'flex'; // Show the modal

            document.getElementById('btn-guardar-precios').addEventListener('click', async function() {
                console.log("Saving prices...");
                for (const id of Object.keys(materiales.tableros)) { const input = document.getElementById(`precio-tablero-${id}`); if (input && !isNaN(parseFloat(input.value))) materiales.tableros[id].precio = parseFloat(input.value); }
                 for (const id of Object.keys(materiales.cantos)) { const input = document.getElementById(`precio-canto-${id}`); if (input && !isNaN(parseFloat(input.value))) materiales.cantos[id].precio = parseFloat(input.value); }
                 for (const [categoria, herrajes] of Object.entries(materiales.herrajes)) { for (const id of Object.keys(herrajes)) { const input = document.getElementById(`precio-${categoria}-${id}`); if (input && !isNaN(parseFloat(input.value))) materiales.herrajes[categoria][id].precio = parseFloat(input.value); } } // Corrected loop
                try { await guardarPrecios(); dialogo.style.display = 'none'; actualizarListaMuebles(); showMessage('Precios actualizados correctamente.', 'success'); console.log("Prices saved successfully."); }
                catch (e) { console.error("Error saving prices:", e); showMessage('Error al guardar los precios.', 'error'); }
            });

            document.getElementById('btn-cerrar-dialogo').addEventListener('click', function() { console.log("Closing price dialog."); dialogo.style.display = 'none'; });
        }

        /**
         * Generates and displays the detailed materials list for production in the UI.
         */
        function generarListaMateriales() {
            console.log("Generating materials list UI.");
            if (muebles.length === 0) {
                alert('No hay muebles para generar la lista de materiales');
                const materialsSection = document.getElementById('materials-list-section');
                if(materialsSection) materialsSection.style.display = 'none';
                return;
            }

            const listaMaterialesDiv = document.getElementById('materiales-produccion-lista');
            if (!listaMaterialesDiv) {
                 console.error("Materials list division not found.");
                 return;
            }
            listaMaterialesDiv.innerHTML = '';

            muebles.forEach(mueble => {
                const muebleMaterialsDiv = document.createElement('div');
                muebleMaterialsDiv.className = 'mueble-materials border border-gray-300 p-4 mb-5 rounded-lg bg-white shadow-sm';
                muebleMaterialsDiv.innerHTML = `<h3 class="text-xl font-semibold text-gray-800 mb-3 border-b border-dashed border-gray-300 pb-2">${mueble.nombre} (x${mueble.cantidad})</h3>`;

                let materialsHtml = '<ul class="list-disc pl-5">';
                 materialsHtml += '<li class="font-bold text-gray-700 mb-1">Tableros:</li>';
                 if (mueble.tableros.length > 0) {
                     for (const tablero of mueble.tableros) {
                         let nombreMaterial, precioUnitario, cantidadTotal, subtotal;
                         if (tablero.tipo && materiales.tableros[tablero.tipo]) {
                             nombreMaterial = materiales.tableros[tablero.tipo].nombre; precioUnitario = materiales.tableros[tablero.tipo].precio;
                             cantidadTotal = tablero.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                             materialsHtml += `<li class="ml-4 text-gray-600">- ${nombreMaterial}: ${cantidadTotal} unidad(es) @ $${precioUnitario.toFixed(2)} = $${subtotal.toFixed(2)}</li>`;
                         } else if (tablero.nombre && tablero.precio !== undefined) {
                             nombreMaterial = `${tablero.nombre} (Personalizado)`; precioUnitario = tablero.precio;
                             cantidadTotal = tablero.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                             materialsHtml += `<li class="ml-4 text-gray-600">- ${nombreMaterial}: ${cantidadTotal} unidad(es) @ $${precioUnitario.toFixed(2)} = $${subtotal.toFixed(2)}</li>`;
                         }
                     }
                 } else { materialsHtml += '<li class="ml-4 text-gray-600">- Ninguno</li>'; }

                 materialsHtml += '<li class="font-bold text-gray-700 mt-3 mb-1">Cantos (ML):</li>';
                 if (mueble.cantos.length > 0) {
                      for (const canto of mueble.cantos) {
                          let nombreMaterial, precioUnitario, cantidadTotal, subtotal;
                          if (canto.tipo && materiales.cantos[canto.tipo]) {
                              nombreMaterial = materiales.cantos[canto.tipo].nombre; precioUnitario = materiales.cantos[canto.tipo].precio;
                              cantidadTotal = canto.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                              materialsHtml += `<li class="ml-4 text-gray-600">- ${nombreMaterial}: ${cantidadTotal.toFixed(2)} ML @ $${precioUnitario.toFixed(2)} = $${subtotal.toFixed(2)}</li>`;
                          } else if (canto.nombre && canto.precio !== undefined) {
                              nombreMaterial = `${canto.nombre} (Personalizado)`; precioUnitario = canto.precio;
                              cantidadTotal = canto.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                              materialsHtml += `<li class="ml-4 text-gray-600">- ${nombreMaterial}: ${cantidadTotal.toFixed(2)} ML @ $${precioUnitario.toFixed(2)} = $${subtotal.toFixed(2)}</li>`;
                          }
                      }
                 } else { materialsHtml += '<li class="ml-4 text-gray-600">- Ninguno</li>'; }


                 materialsHtml += '<li class="font-bold text-gray-700 mt-3 mb-1">Herrajes:</li>';
                 const herrajesAgrupados = {};
                 mueble.herrajes.forEach(herraje => { const categoriaKey = herraje.categoria || 'otros'; if (!herrajesAgrupados[categoriaKey]) herrajesAgrupados[categoriaKey] = []; herrajesAgrupados[categoriaKey].push(herraje); });
                 const herrajeCategorias = Object.keys(herrajesAgrupados);
                       if (herrajeCategorias.length > 0) {
                           herrajeCategorias.forEach(categoria => {
                               const itemsCategoria = herrajesAgrupados[categoria];
                               if (itemsCategoria.length > 0) {
                                    // Removed the subheading row to simplify the PDF table structure
                                    itemsCategoria.forEach(herraje => {
                                        let nombreMaterial, precioUnitario, cantidadTotal, subtotal;
                                        if (herraje.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][herraje.tipo]) {
                                            nombreMaterial = materiales.herrajes[categoria][herraje.tipo].nombre; precioUnitario = materiales.herrajes[categoria][herraje.tipo].precio; cantidadTotal = herraje.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                            materialsHtml += `<li class="ml-8 text-gray-600">- ${nombreMaterial}: ${cantidadTotal} unidad(es) @ $${precioUnitario.toFixed(2)} = $${subtotal.toFixed(2)}</li>`;
                                        } else if (herraje.nombre && herraje.precio !== undefined) {
                                            nombreMaterial = `${herraje.nombre} (Personalizado)`; precioUnitario = herraje.precio; cantidadTotal = herraje.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                            materialsHtml += `<li class="ml-8 text-gray-600">- ${nombreMaterial}: ${cantidadTotal} unidad(es) @ $${precioUnitario.toFixed(2)} = $${subtotal.toFixed(2)}</li>`;
                                        }
                                    });
                               }
                           });
                      } else { materialsHtml += '<li class="ml-4 text-gray-600">- Ninguno</li>'; }

                      if (mueble.transporte > 0 || mueble.instalacion > 0) {
                           if (materialsHtml.includes('<li>')) materialsHtml += '<li class="font-bold text-gray-700 mt-3 mb-1">Costos Adicionales por Mueble:</li>'; // Add space if needed
                          if (mueble.transporte > 0) materialsHtml += `<li class="ml-4 text-gray-600">- Transporte: $${(mueble.transporte * mueble.cantidad).toFixed(2)}</li>`;
                          if (mueble.instalacion > 0) materialsHtml += `<li class="ml-4 text-gray-600">- Instalación: $${(mueble.instalacion * mueble.cantidad).toFixed(2)}</li>`;
                      }


                materialsHtml += '</ul>';
                muebleMaterialsDiv.innerHTML += materialsHtml;
                listaMaterialesDiv.appendChild(muebleMaterialsDiv);
            });

            const materialsSection = document.getElementById('materials-list-section');
            if(materialsSection) materialsSection.style.display = 'block';
            console.log("Materials list UI generated.");
        }


        // Cotizador: Load prices from IndexedDB
        async function cargarPrecios() {
            console.log("Loading prices from IndexedDB.");
            try {
                const preciosGuardados = await getObjectFromStore(preciosStoreName, 'materialPrices');
                if (preciosGuardados) {
                    for (const type in materiales.tableros) { if (preciosGuardados.tableros && preciosGuardados.tableros[type]) materiales.tableros[type].precio = preciosGuardados.tableros[type].precio; }
                    for (const type in materiales.cantos) { if (preciosGuardados.cantos && preciosGuardados.cantos[type]) materiales.cantos[type].precio = preciosGuardados.cantos[type].precio; }
                    for (const category in materiales.herrajes) { if (preciosGuardados.herrajes && preciosGuardados.herrajes[category]) { for (const type in materiales.herrajes[category]) { if (preciosGuardados.herrajes[category][type]) materiales.herrajes[category][type].precio = preciosGuardados.herrajes[category][type].precio; } } }
                    console.log("Cotizador prices loaded from IndexedDB.");
                } else { console.log("No saved Cotizador prices found. Using default prices."); }
            } catch (e) { console.error("Error loading Cotizador prices from IndexedDB:", e); }
        }

        // Cotizador: Save prices to IndexedDB
        async function guardarPrecios() {
            console.log("Saving prices to IndexedDB.");
            try {
                const preciosParaGuardar = { id: 'materialPrices', ...materiales };
                await putDataInStore(preciosStoreName, preciosParaGuardar);
                console.log("Cotizador prices saved to IndexedDB.");
            } catch (e) { console.error("Error saving Cotizador prices to IndexedDB:", e); throw e; }
        }

        // Cotizador: Load saved quotes from IndexedDB
        async function cargarCotizacionesGuardadas() {
            console.log("Loading saved quotes from IndexedDB.");
            try {
                cotizacionesGuardadas = await getDataFromStore(cotizacionesStoreName);
                console.log(`Loaded ${cotizacionesGuardadas.length} saved quotes from IndexedDB.`);
                actualizarListaCotizacionesGuardadas(); // Update UI after loading
            } catch (e) { console.error("Error loading saved quotes from IndexedDB:", e); }
        }

        // Cotizador: Save current quote to IndexedDB
        async function guardarCotizacionActual() {
            console.log("Saving current quote.");
             const clienteNombre = document.getElementById('cliente-nombre').value.trim();
             if (!clienteNombre) { alert('Por favor, ingresa el nombre del cliente para guardar la cotización.'); return; }
             if (muebles.length === 0) { alert('No hay muebles en la cotización actual para guardar.'); return; }

            const cotizacion = {
                id: Date.now(), // Simple timestamp as unique ID
                nombreCliente: clienteNombre,
                fecha: new Date().toISOString(),
                muebles: JSON.parse(JSON.stringify(muebles)), // Deep copy of muebles array
                ganancia: parseFloat(document.getElementById('ganancia').value) || 0,
                descuento: parseFloat(document.getElementById('descuento').value) || 0,
                 infoCliente: { // Save client info with the quote
                     telefono: document.getElementById('cliente-telefono').value.trim(),
                     direccion: document.getElementById('cliente-direccion').value.trim(),
                 }
            };

            try {
                await putDataInStore(cotizacionesStoreName, cotizacion);
                cotizacionesGuardadas.push(cotizacion); // Add to local array
                actualizarListaCotizacionesGuardadas(); // Update UI
                showMessage('Cotización guardada correctamente.', 'success');
                console.log("Current quote saved.");
            } catch (e) {
                console.error("Error saving current quote:", e);
                showMessage('Error al guardar la cotización.', 'error');
            }
        }

        // Cotizador: Load a saved quote from IndexedDB
        async function cargarCotizacionGuardada(id) {
             console.log("Loading saved quote with ID:", id);
             try {
                 const quoteToLoad = await getObjectFromStore(cotizacionesStoreName, id);
                 if (quoteToLoad) {
                     muebles = JSON.parse(JSON.stringify(quoteToLoad.muebles)); // Deep copy to current muebles
                     document.getElementById('cliente-nombre').value = quoteToLoad.nombreCliente || '';
                     document.getElementById('cliente-telefono').value = quoteToLoad.infoCliente?.telefono || '';
                     document.getElementById('cliente-direccion').value = quoteToLoad.infoCliente?.direccion || '';
                     document.getElementById('ganancia').value = quoteToLoad.ganancia || 0;
                     document.getElementById('descuento').value = quoteToLoad.descuento || 0;

                     actualizarListaMuebles(); // Update the UI with the loaded muebles
                      // Clear current dynamic items after loading the quote to prepare for new input
                      document.querySelectorAll('.current-mueble-section .dynamic-items-container').forEach(container => { container.innerHTML = ''; });
                      agregarTableroItem(); agregarCantoItem(); agregarHerrajeItem('correderas'); agregarHerrajeItem('bisagras'); agregarHerrajeItem('tiradores'); agregarHerrajeItem('otros');

                     showMessage('Cotización cargada correctamente.', 'success');
                     console.log("Saved quote loaded.");
                 } else {
                     showMessage('Cotización no encontrada.', 'error');
                     console.warn("Saved quote not found with ID:", id);
                 }
             } catch (e) {
                 console.error("Error loading saved quote:", e);
                 showMessage('Error al cargar la cotización.', 'error');
             }
         }

         /**
          * Deletes a saved quote from IndexedDB.
          * @param {number} id The ID of the saved quote to delete.
          */
         async function eliminarCotizacionGuardada(id) {
             console.log("Deleting saved quote with ID:", id);
             if (confirm('¿Estás seguro de que quieres eliminar esta cotización guardada?')) {
                 try {
                     await deleteDataFromStore(cotizacionesStoreName, id);
                     cotizacionesGuardadas = cotizacionesGuardadas.filter(quote => quote.id !== id); // Remove from local array
                     actualizarListaCotizacionesGuardadas(); // Update UI
                     showMessage('Cotización eliminada correctamente.', 'success');
                     console.log("Saved quote deleted.");
                 } catch (e) {
                     console.error("Error deleting saved quote:", e);
                     showMessage('Error al eliminar la cotización.', 'error');
                 }
             }
         }


        /**
         * Updates the list of saved quotes displayed in the UI.
         */
        function actualizarListaCotizacionesGuardadas() {
            console.log("Updating saved quotes list UI.");
            const listaCotizacionesUl = document.getElementById('lista-cotizaciones-guardadas');
            if (!listaCotizacionesUl) {
                console.error("Saved quotes list UL element not found.");
                return;
            }
            listaCotizacionesUl.innerHTML = '';
            if (cotizacionesGuardadas.length === 0) {
                listaCotizacionesUl.innerHTML = '<li class="text-gray-600">No hay cotizaciones guardadas.</li>';
                console.log("Saved quotes list is empty.");
                return;
            }

            cotizacionesGuardadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // Sort by date, newest first

            cotizacionesGuardadas.forEach(quote => {
                const listItem = document.createElement('li');
                const fecha = new Date(quote.fecha);
                const fechaFormatted = formatDate(fecha);
                const totalQuote = quote.muebles.reduce((sum, mueble) => {
                     const costoUnitario = calcularCostoUnitarioMueble(mueble, quote.ganancia || 0);
                     return sum + (costoUnitario * mueble.cantidad);
                }, 0);
                 const montoDescuento = totalQuote * ((quote.descuento || 0) / 100);
                 const totalConDescuento = totalQuote - montoDescuento;


                listItem.innerHTML = `
                    <div class="quote-info">
                        <strong class="text-blue-700">${quote.nombreCliente}</strong> (${fechaFormatted}) - Total: $${totalConDescuento.toFixed(2)}
                    </div>
                    <div class="quote-actions">
                        <button class="btn-secondary btn-material bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs" onclick="cargarCotizacionGuardada(${quote.id})">Cargar</button>
                        <button class="btn-delete btn-material bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs" onclick="eliminarCotizacionGuardada(${quote.id})">Eliminar</button>
                    </div>
                `;
                listaCotizacionesUl.appendChild(listItem);
            });
            console.log("Saved quotes list updated.");
        }

        /**
         * Exports all saved quotes to a JSON file.
         */
        async function exportarCotizaciones() {
            console.log("Exporting quotes.");
            try {
                const allQuotes = await getDataFromStore(cotizacionesStoreName);
                if (allQuotes.length === 0) { alert('No hay cotizaciones guardadas para exportar.'); return; }
                const dataStr = JSON.stringify(allQuotes, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'cotizaciones_muebles.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                 showMessage('Cotizaciones exportadas correctamente.', 'success');
                 console.log("Quotes exported successfully.");
            } catch (e) { console.error("Error exporting quotes:", e); showMessage("No se pudieron exportar las cotizaciones.", 'error'); }
        }

        /**
         * Imports quotes from a selected JSON file into IndexedDB.
         * @param {Event} event The file input change event.
         */
        function importarCotizaciones(event) {
            console.log("Importing quotes.");
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importedQuotes = JSON.parse(e.target.result);
                    if (!Array.isArray(importedQuotes)) { alert('El archivo seleccionado no parece contener cotizaciones válidas.'); return; }
                    const overwrite = confirm('¿Deseas sobrescribir las cotizaciones guardadas actuales con las del archivo? (Cancelar para fusionar)');

                    if (overwrite) {
                        console.log("Clearing existing quotes for overwrite.");
                        await clearStore(cotizacionesStoreName);
                    }

                    const transaction = db.transaction([cotizacionesStoreName], 'readwrite');
                    const objectStore = transaction.objectStore(cotizacionesStoreName);
                    importedQuotes.forEach(quote => { if (quote.id === undefined) quote.id = Date.now() + Math.random(); objectStore.put(quote); });

                    transaction.oncomplete = async function() {
                        console.log("Import transaction complete.");
                        await cargarCotizacionesGuardadas();
                        showMessage(overwrite ? 'Cotizaciones importadas (sobrescritas) correctamente.' : 'Cotizaciones importadas (fusionadas) correctamente.', 'success');
                    };
                    transaction.onerror = function(event) {
                         console.error("Import transaction error:", event.target.error);
                         showMessage('Error al importar cotizaciones durante la transacción.', 'error');
                    };

                } catch (error) { console.error("Error processing import file:", error); showMessage('Error al procesar el archivo. Asegúrate de que es un archivo de cotizaciones válido.', 'error'); }
            };
            reader.onerror = function(e) { console.error("Error reading import file:", e); showMessage('Error al leer el archivo.', 'error'); };
            reader.readAsText(file);
        }

         /**
          * Generates a PDF document for the current quote.
          */
         function generarPDF() {
             console.log("Generating quote PDF.");
             if (muebles.length === 0) { alert('No hay muebles para generar PDF'); return; }
             const { jsPDF } = window.jspdf;
             const doc = new jsPDF('p', 'mm', 'letter');
             const gananciaInput = document.getElementById('ganancia');
             const porcentajeGanancia = gananciaInput ? parseFloat(gananciaInput.value) || 0 : 0;
             const descuentoInput = document.getElementById('descuento');
             const porcentajeDescuento = descuentoInput ? parseFloat(descuentoInput.value) || 0 : 0;
             const empresaNombre = infoEmpresa.nombre; const empresaDireccion = infoEmpresa.direccion; const empresaTelefono = infoEmpresa.telefono; const empresaEmail = infoEmpresa.email; const empresaLogoUrl = infoEmpresa.logoUrl;
             const clienteNombreInput = document.getElementById('cliente-nombre');
             const clienteNombre = clienteNombreInput ? clienteNombreInput.value.trim() : '';
             const clienteTelefonoInput = document.getElementById('cliente-telefono');
             const clienteTelefono = clienteTelefonoInput ? clienteTelefonoInput.value.trim() : '';
             const clienteDireccionInput = document.getElementById('cliente-direccion');
             const clienteDireccion = clienteDireccionInput ? clienteDireccionInput.value.trim() : '';

             const fechaCreacion = new Date();
             const fechaValidez = new Date();
             fechaValidez.setDate(fechaCreacion.getDate() + 30);
             const fechaCreacionFormatted = formatDate(fechaCreacion);
             const fechaValidezFormatted = formatDate(fechaValidez);

             const addPdfContent = (doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted, fechaValidezFormatted, porcentajeGanancia, porcentajeDescuento) => {
                 doc.setFontSize(10); let empresaTextY = 10; if (infoEmpresa.logoUrl) empresaTextY = 55;
                 doc.text(empresaNombre, 15, empresaTextY); doc.text(empresaDireccion, 15, empresaTextY + 5); doc.text(`Teléfono: ${empresaTelefono}`, 15, empresaTextY + 10); doc.text(`Email: ${empresaEmail}`, 15, empresaTextY + 15);
                 doc.setFontSize(20); doc.text('COTIZACION', doc.internal.pageSize.getWidth() - 15, 15, { align: 'right' });
                 doc.setFontSize(10); doc.text(`FECHA: ${fechaCreacionFormatted}`, doc.internal.pageSize.getWidth() - 15, 25, { align: 'right' }); doc.text(`Presupuesto válido hasta: ${fechaValidezFormatted}`, doc.internal.pageSize.getWidth() - 15, 35, { align: 'right' });
                 let currentY = Math.max(empresaTextY + 25, 45); doc.setFontSize(12); doc.text('Información del Cliente:', 15, currentY); currentY += 7;
                 if (clienteNombre) { doc.text(`Nombre: ${clienteNombre}`, 15, currentY); currentY += 7; }
                 if (clienteTelefono) { doc.text(`Teléfono: ${clienteTelefono}`, 15, currentY); currentY += 7; }
                 if (clienteDireccion) { doc.text(`Dirección: ${clienteDireccion}`, 15, currentY); currentY += 7; }
                 if (clienteNombre || clienteTelefono || clienteDireccion) currentY += 5;

                 const tableData = muebles.map(mueble => {
                     const costoUnitario = calcularCostoUnitarioMueble(mueble, porcentajeGanancia);
                     const importe = calcularImporteMueble(mueble, porcentajeGanancia);
                     return [mueble.cantidad, mueble.nombre, `$${costoUnitario.toFixed(2)}`, `$${importe.toFixed(2)}`];
                 });

                 const subtotal = muebles.reduce((sum, mueble) => sum + calcularImporteMueble(mueble, porcentajeGanancia), 0);
                 const montoDescuento = subtotal * (porcentajeDescuento / 100);
                 const totalGeneral = subtotal - montoDescuento;

                 doc.autoTable({
                     startY: currentY, head: [['CANT.', 'DESCRIPCION', 'PRECIO UNITARIO', 'IMPORTE']], body: tableData,
                     columnStyles: { 0: { cellWidth: 20, halign: 'center' }, 1: { cellWidth: 80, halign: 'left' }, 2: { cellWidth: 40, halign: 'right' }, 3: { cellWidth: 40, halign: 'right' } },
                     headStyles: { halign: 'center', fillColor: [52, 152, 219], textColor: [255, 255, 255] },
                     styles: { lineWidth: 0.1, lineColor: [0, 0, 0] }, bodyStyles: { lineWidth: 0.1, lineColor: [0, 0, 0] }
                 });

                 const finalY = doc.lastAutoTable.finalY;
                 const totalsTableData = [
                     ['SUB-TOTAL', `$${subtotal.toFixed(2)}`],
                     ['DESCUENTOS', `$${montoDescuento.toFixed(2)} (${porcentajeDescuento}%)`],
                     [{content: 'TOTAL GENERAL', styles: {fontStyle: 'bold'}}, `$${totalGeneral.toFixed(2)}`]
                 ];
                  doc.autoTable({
                      startY: finalY + 5, body: totalsTableData, theme: 'plain', styles: { cellPadding: 2 },
                      columnStyles: { 0: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }, 1: { cellWidth: 40, halign: 'right' } },
                      margin: { left: 115 },
                  });

                 let termsY = doc.lastAutoTable.finalY + 20; const estimatedTermsHeight = 40;
                 if (termsY + estimatedTermsHeight > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); termsY = 15; }

                 doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.text('Terminos y condiciones:', 15, termsY); termsY += 7;
                 doc.setFont("helvetica", "normal");
                 doc.text('• Los planos deberán ser aprobados y firmados por el cliente una vez realizado el levantamiento.', 15, termsY); termsY += 5;
                 doc.text('• Cualquier modificación o ajuste posterior implicará un costo adicional.', 15, termsY); termsY += 5;
                 doc.text('• Condiciones de pago: 70 % al inicio del proyecto y 30 % al finalizar el trabajo.', 15, termsY); termsY += 10;
                 doc.setFont("helvetica", "bold"); doc.text('Jesus Vargas Alcántara', 15, termsY); termsY += 5;
                 doc.setFont("helvetica", "normal"); doc.text('Ced.: 22300660069', 15, termsY); termsY += 5;
                 doc.text('Banco de Reservas: cuenta # 8900058450', 15, termsY); termsY += 5;
                 doc.text('APAP: cuenta # 1028795572', 15, termsY);
             };

             if (empresaLogoUrl) {
                 const img = new Image();
                 img.onload = function() { doc.addImage(img, 'PNG', 15, 10, 40, 40); addPdfContent(doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted, fechaValidezFormatted, porcentajeGanancia, porcentajeDescuento); doc.save('cotizacion-muebles.pdf'); console.log("Quote PDF generated with logo."); };
                 img.onerror = function() { console.error("Error loading logo for PDF."); addPdfContent(doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted, fechaValidezFormatted, porcentajeGanancia, porcentajeDescuento); doc.save('cotizacion-muebles.pdf'); console.log("Quote PDF generated without logo due to error."); };
                 img.crossOrigin = ''; img.src = empresaLogoUrl;
             } else {
                 addPdfContent(doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted, fechaValidezFormatted, porcentajeGanancia, porcentajeDescuento);
                 doc.save('cotizacion-muebles.pdf');
                 console.log("Quote PDF generated without logo.");
             }
         }

         /**
          * Generates a PDF document for the detailed materials list.
          */
         function generarPDFListaMateriales() {
              console.log("Generating materials list PDF.");
              if (muebles.length === 0) { alert('No hay muebles para generar la lista de materiales en PDF'); return; }
              const { jsPDF } = window.jspdf;
              const doc = new jsPDF('p', 'mm', 'letter');
              const empresaNombre = infoEmpresa.nombre; const empresaDireccion = infoEmpresa.direccion; const empresaTelefono = infoEmpresa.telefono; const empresaEmail = infoEmpresa.email; const empresaLogoUrl = infoEmpresa.logoUrl;
              const clienteNombreInput = document.getElementById('cliente-nombre');
              const clienteNombre = clienteNombreInput ? clienteNombreInput.value.trim() : '';
              const clienteTelefonoInput = document.getElementById('cliente-telefono');
              const clienteTelefono = clienteTelefonoInput ? clienteTelefonoInput.value.trim() : '';
              const clienteDireccionInput = document.getElementById('cliente-direccion');
              const clienteDireccion = clienteDireccionInput ? clienteDireccionInput.value.trim() : '';
              const fechaCreacion = new Date();
              const fechaCreacionFormatted = formatDate(fechaCreacion); // Define here to be accessible in onload


              const addPdfMaterialsContent = (doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted) => {
                  doc.setFontSize(10); let empresaTextY = 10; if (infoEmpresa.logoUrl) empresaTextY = 55;
                  doc.text(empresaNombre, 15, empresaTextY); doc.text(empresaDireccion, 15, empresaTextY + 5); doc.text(`Teléfono: ${empresaTelefono}`, 15, empresaTextY + 10); doc.text(`Email: ${empresaEmail}`, 15, empresaTextY + 15);
                  doc.setFontSize(20); doc.text('MATRIZ DE PRODUCCION', doc.internal.pageSize.getWidth() - 15, 15, { align: 'right' });
                  doc.setFontSize(10); doc.text(`FECHA: ${fechaCreacionFormatted}`, doc.internal.pageSize.getWidth() - 15, 25, { align: 'right' });
                  let currentY = Math.max(empresaTextY + 25, 45); doc.setFontSize(12); doc.text('Información del Cliente:', 15, currentY); currentY += 7;
                  if (clienteNombre) { doc.text(`Nombre: ${clienteNombre}`, 15, currentY); currentY += 7; }
                  if (clienteTelefono) { doc.text(`Teléfono: ${clienteTelefono}`, 15, currentY); currentY += 7; }
                  if (clienteDireccion) { doc.text(`Dirección: ${clienteDireccion}`, 15, currentY); currentY += 7; }
                  if (clienteNombre || clienteTelefono || clienteDireccion) currentY += 5;

                  currentY += 10;

                  muebles.forEach(mueble => {
                      doc.setFontSize(14); doc.setFont("helvetica", "bold");
                      doc.text(`${mueble.nombre} (x${mueble.cantidad})`, 15, currentY); currentY += 8;
                      doc.setFontSize(10); doc.setFont("helvetica", "normal");

                      const materialTableData = [];
                      let totalCostoMaterialesMueble = 0;

                      if (mueble.tableros.length > 0) {
                          for (const tablero of mueble.tableros) {
                              let nombreMaterial, precioUnitario, cantidadTotal, subtotal;
                              if (tablero.tipo && materiales.tableros[tablero.tipo]) {
                                  nombreMaterial = materiales.tableros[tablero.tipo].nombre; precioUnitario = materiales.tableros[tablero.tipo].precio; cantidadTotal = tablero.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                  materialTableData.push([nombreMaterial, `${cantidadTotal} unidad(es)`, `$${precioUnitario.toFixed(2)}`, `$${subtotal.toFixed(2)}`]);
                                  totalCostoMaterialesMueble += subtotal;
                              } else if (tablero.nombre && tablero.precio !== undefined) {
                                  nombreMaterial = `${tablero.nombre} (Personalizado)`; precioUnitario = tablero.precio; cantidadTotal = tablero.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                  materialTableData.push([nombreMaterial, `${cantidadTotal} unidad(es)`, `$${precioUnitario.toFixed(2)}`, `$${subtotal.toFixed(2)}`]);
                                  totalCostoMaterialesMueble += subtotal;
                              }
                          }
                      }

                       if (mueble.cantos.length > 0) {
                           if (materialTableData.length > 0) materialTableData.push(['', '', '', '']);
                           for (const canto of mueble.cantos) {
                               let nombreMaterial, precioUnitario, cantidadTotal, subtotal;
                               if (canto.tipo && materiales.cantos[canto.tipo]) {
                                   nombreMaterial = materiales.cantos[canto.tipo].nombre; precioUnitario = materiales.cantos[canto.tipo].precio; cantidadTotal = canto.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                   materialTableData.push([nombreMaterial, `${cantidadTotal.toFixed(2)} ML`, `$${precioUnitario.toFixed(2)}`, `$${subtotal.toFixed(2)}`]);
                                   totalCostoMaterialesMueble += subtotal;
                               } else if (canto.nombre && canto.precio !== undefined) {
                                   nombreMaterial = `${canto.nombre} (Personalizado)`; precioUnitario = canto.precio; cantidadTotal = canto.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                   materialTableData.push([nombreMaterial, `${cantidadTotal.toFixed(2)} ML`, `$${precioUnitario.toFixed(2)}`, `$${subtotal.toFixed(2)}`]);
                                   totalCostoMaterialesMueble += subtotal;
                               }
                           }
                       }

                      const herrajesAgrupados = {};
                      mueble.herrajes.forEach(herraje => { const categoriaKey = herraje.categoria || 'otros'; if (!herrajesAgrupados[categoriaKey]) herrajesAgrupados[categoriaKey] = []; herrajesAgrupados[categoriaKey].push(herraje); });
                      const herrajeCategorias = Object.keys(herrajesAgrupados);
                       if (herrajeCategorias.length > 0) {
                           if (materialTableData.length > 0) materialTableData.push(['', '', '', '']);
                           herrajeCategorias.forEach(categoria => {
                               const itemsCategoria = herrajesAgrupados[categoria];
                               if (itemsCategoria.length > 0) {
                                    // Removed the subheading row to simplify the PDF table structure
                                    itemsCategoria.forEach(herraje => {
                                        let nombreMaterial, precioUnitario, cantidadTotal, subtotal;
                                        if (herraje.tipo && materiales.herrajes[categoria] && materiales.herrajes[categoria][herraje.tipo]) {
                                            nombreMaterial = materiales.herrajes[categoria][herraje.tipo].nombre; precioUnitario = materiales.herrajes[categoria][herraje.tipo].precio; cantidadTotal = herraje.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                            materialTableData.push([nombreMaterial, `${cantidadTotal} unidad(es)`, `$${precioUnitario.toFixed(2)}`, `$${subtotal.toFixed(2)}`]);
                                            totalCostoMaterialesMueble += subtotal;
                                        } else if (herraje.nombre && herraje.precio !== undefined) {
                                            nombreMaterial = `${herraje.nombre} (Personalizado)`; precioUnitario = herraje.precio; cantidadTotal = herraje.cantidad * mueble.cantidad; subtotal = cantidadTotal * precioUnitario;
                                            materialTableData.push([nombreMaterial, `${cantidadTotal} unidad(es)`, `$${precioUnitario.toFixed(2)}`, `$${subtotal.toFixed(2)}`]);
                                            totalCostoMaterialesMueble += subtotal;
                                        }
                                    });
                               }
                           });
                      } else { materialsHtml += '<li class="ml-4 text-gray-600">- Ninguno</li>'; }

                      if (mueble.transporte > 0 || mueble.instalacion > 0) {
                           if (materialTableData.length > 0) materialTableData.push(['', '', '', '']); // Add space if needed
                          materialTableData.push([{content: 'Costos Adicionales por Mueble:', colSpan: 4, styles: {fontStyle: 'bold'}}]); // Section header
                          if (mueble.transporte > 0) materialTableData.push(['Transporte', `${mueble.cantidad} unidad(es)`, `$${mueble.transporte.toFixed(2)}`, `$${(mueble.transporte * mueble.cantidad).toFixed(2)}`]);
                          if (mueble.instalacion > 0) materialTableData.push(['Instalación', `${mueble.cantidad} unidad(es)`, `$${mueble.instalacion.toFixed(2)}`, `$${(mueble.instalacion * mueble.cantidad).toFixed(2)}`]);
                      }


                      if (materialTableData.length > 0) {
                         doc.autoTable({
                             startY: currentY, head: [['MATERIAL', 'CANTIDAD', 'PRECIO UNITARIO', 'SUBTOTAL']], body: materialTableData,
                             columnStyles: { 0: { cellWidth: 70, halign: 'left' }, 1: { cellWidth: 30, halign: 'center' }, 2: { cellWidth: 30, halign: 'right' }, 3: { cellWidth: 30, halign: 'right' } },
                             headStyles: { fillColor: [155, 89, 182], textColor: [255, 255, 255], halign: 'center' },
                             styles: { lineWidth: 0.1, lineColor: [0, 0, 0], cellPadding: 2 },
                             bodyStyles: { lineWidth: 0.1, lineColor: [0, 0, 0] },
                             margin: { left: 15, right: 15 }
                         });
                         currentY = doc.lastAutoTable.finalY + 10;
                      } else {
                          currentY += 10;
                      }

                      // Add Total Cost of Materials for this mueble below its table
                      if (totalCostoMaterialesMueble > 0) {
                           const totalMaterialesData = [
                               [{content: 'COSTO TOTAL DE MATERIALES DEL MUEBLE', colSpan: 3, styles: {fontStyle: 'bold', halign: 'right'}}, `$${totalCostoMaterialesMueble.toFixed(2)}`]
                           ];
                            doc.autoTable({
                                startY: currentY, body: totalMaterialesData, theme: 'plain', styles: { cellPadding: 2 },
                                columnStyles: { 0: { cellWidth: 70 + 30 + 30, halign: 'right', fontStyle: 'bold' }, 1: { cellWidth: 30, halign: 'right' } },
                                margin: { left: 15 },
                            });
                            currentY = doc.lastAutoTable.finalY; // Update Y position after this total

                           const totalTransporteInstalacionMueble = (mueble.transporte || 0) * mueble.cantidad + (mueble.instalacion || 0) * mueble.cantidad;
                           const totalAdicionalesData = [
                               [{content: 'COSTO TOTAL TRANSPORTE E INSTALACIÓN DEL MUEBLE', colSpan: 3, styles: {fontStyle: 'bold', halign: 'right'}}, `$${totalTransporteInstalacionMueble.toFixed(2)}`]
                           ];
                            doc.autoTable({
                                startY: currentY, body: totalAdicionalesData, theme: 'plain', styles: { cellPadding: 2 },
                                columnStyles: { 0: { cellWidth: 70 + 30 + 30, halign: 'right', fontStyle: 'bold' }, 1: { cellWidth: 30, halign: 'right' } },
                                margin: { left: 15 },
                            });
                           currentY = doc.lastAutoTable.finalY;

                           const costoTotalProduccionMueble = totalCostoMaterialesMueble + totalTransporteInstalacionMueble;
                            const totalProduccionData = [
                                [{content: 'COSTO TOTAL DE PRODUCCIÓN DEL MUEBLE', colSpan: 3, styles: {fontStyle: 'bold', halign: 'right'}}, `$${costoTotalProduccionMueble.toFixed(2)}`]
                            ];
                             doc.autoTable({
                                 startY: currentY, body: totalProduccionData, theme: 'plain', styles: { cellPadding: 2 },
                                 columnStyles: { 0: { cellWidth: 70 + 30 + 30, halign: 'right', fontStyle: 'bold' }, 1: { cellWidth: 30, halign: 'right' } },
                                 margin: { left: 15 },
                             });
                            currentY = doc.lastAutoTable.finalY + 10;
                      } else {
                           currentY += 10; // Add space even if no costs were calculated for this mueble
                      }

                  });
              };


              if (empresaLogoUrl) {
                  const img = new Image();
                  // Pass fechaCreacionFormatted to the onload function
                  img.onload = function() { doc.addImage(img, 'PNG', 15, 10, 40, 40); addPdfMaterialsContent(doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted); doc.save('matriz-produccion.pdf'); console.log("Materials list PDF generated with logo."); };
                  img.onerror = function() { console.error("Error loading logo for materials PDF."); addPdfMaterialsContent(doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted); doc.save('matriz-produccion.pdf'); console.log("Materials list PDF generated without logo due to error."); };
                  img.crossOrigin = ''; img.src = empresaLogoUrl;
              } else {
                   addPdfMaterialsContent(doc, empresaNombre, empresaDireccion, empresaTelefono, empresaEmail, clienteNombre, clienteTelefono, clienteDireccion, fechaCreacionFormatted);
                   doc.save('matriz-produccion.pdf');
                   console.log("Materials list PDF generated without logo.");
              }
         }


        // ======================================================================
        // Optimizador Functionality
        // ======================================================================

        let sheets = []; // Global variable to hold sheets data for optimizador

        /**
         * Adds a new row for entering piece dimensions to the piece table (Optimizador).
         */
        function addPiece() {
            console.log("Adding new piece row.");
            const pieceTableBody = document.querySelector('#optimizador #pieceTable tbody'); // Use #optimizador prefix
             if (!pieceTableBody) { console.error("Optimizador Piece table body not found!"); return; }
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="number" class="pieceWidth p-1 border border-gray-300 rounded-md" value="100" min="1"></td>
                <td><input type="number" class="pieceHeight p-1 border border-gray-300 rounded-md" value="100" min="1"></td>
                <td><input type="number" class="pieceQty p-1 border border-gray-300 rounded-md" value="1" min="1"></td>
                <td><button class="btn-delete bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs" onclick="removePiece(this)">Eliminar</button></td>
            `;
            pieceTableBody.appendChild(newRow);
            console.log("New piece row added.");
        }


        /**
         * Removes the piece input row associated with the clicked button (Optimizador).
         * @param {HTMLButtonElement} button The 'Eliminar' button that was clicked.
         */
        function removePiece(button) {
             console.log("Removing piece row.");
             const row = button.closest('tr'); // Use closest to find the parent table row
             if (row) {
                 row.remove();
                 console.log("Piece row removed.");
             } else {
                 console.error("Could not find parent row to remove.");
             }
        }

        /**
         * Represents a free rectangular area on a sheet where pieces can be placed (Optimizador).
         * In this strip-based approach, this represents a segment within a horizontal strip.
         * @typedef {object} FreeRectangle
         * @property {number} x - X coordinate of the top-left corner.
         * @property {number} y - Y coordinate of the top-left corner (should be the same for all nodes in a strip).
         * @property {number} width - Width of the free segment.
         * @property {number} height - Height of the free segment (should be the same for all nodes in a strip).
         * @property {number} area - Area of the segment (width * height).
         */

        /**
         * Represents a piece to be cut (Optimizador).
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
         * Represents a single sheet with placed pieces and remaining free areas (strips) (Optimizador).
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


        /**
         * Main function to trigger the optimization process (Optimizador).
         */
        function optimizeCuts() {
            console.log("Starting optimization process.");
            sheets = []; // Clear the global sheets array
            const sheetWidthInput = document.getElementById('sheetWidth');
            const sheetHeightInput = document.getElementById('sheetHeight');
            const kerfInput = document.getElementById('kerf');
            const marginInput = document.getElementById('margin');
            const sheetGrainInput = document.getElementById('sheetGrain');
            const sortPrioritySelect = document.getElementById('sortPriority');
            const summaryElement = document.getElementById('summary');
            const sheetVisualsDiv = document.getElementById('sheetVisuals');

             if (!sheetWidthInput || !sheetHeightInput || !kerfInput || !marginInput || !sheetGrainInput || !sortPrioritySelect || !summaryElement || !sheetVisualsDiv) {
                 console.error("One or more Optimizador input/output elements not found!");
                 showMessage("Error: No se encontraron elementos necesarios para el optimizador.", 'error');
                 return;
             }

            const sheetWidth = parseInt(sheetWidthInput.value);
            const sheetHeight = parseInt(sheetHeightInput.value);
            const kerf = parseFloat(kerfInput.value);
            const margin = parseFloat(marginInput.value) || 0;
            const sheetHasGrain = sheetGrainInput.checked;
            const sortPriority = sortPrioritySelect.value;

            if (isNaN(sheetWidth) || isNaN(sheetHeight) || sheetWidth <= 0 || sheetHeight <= 0) { showMessage("Por favor, introduce dimensiones válidas (> 0) para la plancha.", 'error'); console.error("Invalid sheet dimensions."); return; }
            if (isNaN(kerf) || kerf < 0) { showMessage("El grosor de la sierra no puede ser negativo.", 'error'); console.error("Invalid kerf value."); return; }
            if (isNaN(margin) || margin < 0) { showMessage("El margen no puede ser negativo.", 'error'); console.error("Invalid margin value."); return; }
            if (sheetWidth < 2 * margin || sheetHeight < 2 * margin) { showMessage("La plancha es demasiado pequeña para el margen especificado.", 'error'); console.error("Sheet too small for margin."); return; }

            const usableWidth = sheetWidth - 2 * margin;
            const usableHeight = sheetHeight - 2 * margin;

            const pieceRows = document.querySelectorAll('#optimizador #pieceTable tbody tr'); // Use #optimizador prefix
            let piecesToCut = [];
            let invalidPiecesFound = false;

            pieceRows.forEach((row, index) => {
                const wInput = row.querySelector('.pieceWidth');
                const hInput = row.querySelector('.pieceHeight');
                const qtyInput = row.querySelector('.pieceQty');
                if (!wInput || !hInput || !qtyInput) { invalidPiecesFound = true; console.warn(`Missing inputs in piece row ${index}.`); return; }

                const w = parseInt(wInput.value);
                const h = parseInt(hInput.value);
                const qty = parseInt(qtyInput.value);

                if (isNaN(w) || isNaN(h) || isNaN(qty) || w <= 0 || h <= 0 || qty <= 0) { if (w || h || qty) { invalidPiecesFound = true; console.warn(`Invalid dimensions/quantity in piece row ${index}.`); } return; }

                let fitsInOriginal = (w <= usableWidth && h <= usableHeight);
                let fitsInRotated = (!sheetHasGrain && h <= usableWidth && w <= usableHeight);

                if (sheetHasGrain && !fitsInOriginal) { invalidPiecesFound = true; console.warn(`Piece ${index} (${w}x${h}) does not fit with grain.`); return; }
                if (!sheetHasGrain && !fitsInOriginal && !fitsInRotated) { invalidPiecesFound = true; console.warn(`Piece ${index} (${w}x${h}) does not fit in any orientation.`); return; }

                for (let i = 0; i < qty; i++) {
                    piecesToCut.push({ id: `${index}-${i}`, originalIndex: index, width: w, height: h, area: w * h, placed: false, placedWidth: w, placedHeight: h });
                }
            });

            if (invalidPiecesFound) showMessage("Algunas piezas tienen dimensiones/cantidad inválida o son más grandes que el área útil de la plancha. Serán ignoradas o podrían no caber.", 'info', 6000);
            if (piecesToCut.length === 0) {
                showMessage("Añade al menos una pieza válida para optimizar.", 'error');
                summaryElement.innerText = "No hay piezas válidas para procesar.";
                sheetVisualsDiv.innerHTML = '';
                console.log("No valid pieces to process.");
                return;
            }

             piecesToCut.sort((a, b) => {
                 switch (sortPriority) {
                     case 'area_desc': return b.area - a.area;
                     case 'width_desc': if (b.width !== a.width) return b.width - a.width; return b.height - a.height;
                     case 'height_asc': if (a.height !== b.height) return a.height - b.height; return a.width - b.width;
                     case 'height_desc': default: if (b.height !== a.height) return b.height - a.height; return b.width - a.width;
                 }
             });
             console.log(`Optimizing ${piecesToCut.length} pieces.`);

            piecesToCut.forEach((piece) => {
                if (piece.placed) return;

                let bestFitSheetIndex = -1;
                let bestFitNodeIndex = -1;
                let bestOrientation = { width: piece.width, height: piece.height };

                let minHeightDifference = Infinity;
                let bestY = Infinity;
                let bestX = Infinity;
                let minWasteInSpot = Infinity;

                let foundStrictGrainFit = false;

                if (sheetHasGrain) {
                     let strictBestSheetIndex = -1; let strictBestNodeIndex = -1; let strictBestX = Infinity;
                     for (let i = 0; i < sheets.length; i++) {
                         const sheet = sheets[i];
                         sheet.freeRectangles.sort((a, b) => { if (a.y !== b.y) return a.y - b.y; return a.x - b.x; });
                         for (let j = 0; j < sheet.freeRectangles.length; j++) {
                             const node = sheet.freeRectangles[j];
                             if (piece.width <= node.width && piece.height <= node.height && Math.abs(piece.height - node.height) < kerf * 2) {
                                  if (node.x < strictBestX) { strictBestX = node.x; strictBestSheetIndex = i; strictBestNodeIndex = j; }
                             }
                         }
                     }
                     if (strictBestSheetIndex !== -1) {
                         piece.placedWidth = piece.width; piece.placedHeight = piece.height;
                         placePieceInNodeInStrip(piece, sheets[strictBestSheetIndex], strictBestNodeIndex, kerf, margin);
                         foundStrictGrainFit = true;
                         console.log(`Piece ${piece.id} placed with strict grain fit on sheet ${strictBestSheetIndex + 1}.`);
                     }
                }

                if (!foundStrictGrainFit) {
                     for (let i = 0; i < sheets.length; i++) {
                         const sheet = sheets[i];
                         sheet.freeRectangles.sort((a, b) => { if (a.y !== b.y) return a.y - b.y; return a.x - b.x; });
                         for (let j = 0; j < sheet.freeRectangles.length; j++) {
                             const node = sheet.freeRectangles[j];
                             let fitsInOriginal = (piece.width <= node.width && piece.height <= node.height);
                             let fitsInRotated = (!sheetHasGrain && piece.height <= node.width && piece.width <= node.height);

                             if (fitsInOriginal) {
                                 const currentHeightDifference = Math.abs(piece.height - node.height);
                                 const currentWaste = (node.width * node.height) - (piece.width * piece.height);
                                 if (currentHeightDifference < minHeightDifference || (currentHeightDifference === minHeightDifference && node.y < bestY) || (currentHeightDifference === minHeightDifference && node.y === bestY && node.x < bestX) || (currentHeightDifference === minHeightDifference && node.y === bestY && node.y === bestY && node.x === bestX && currentWaste < minWasteInSpot)) {
                                     minHeightDifference = currentHeightDifference; bestY = node.y; bestX = node.x; minWasteInSpot = currentWaste;
                                     bestFitSheetIndex = i; bestFitNodeIndex = j; bestOrientation = { width: piece.width, height: piece.height };
                                 }
                             }
                             if (fitsInRotated) {
                                 const currentHeightDifference = Math.abs(piece.width - node.height);
                                 const currentWaste = (node.width * node.height) - (piece.height * piece.width);
                                 if (currentHeightDifference < minHeightDifference || (currentHeightDifference === minHeightDifference && node.y < bestY) || (currentHeightDifference === minHeightDifference && node.y === bestY && node.x < bestX) || (currentHeightDifference === minHeightDifference && node.y === bestY && node.y === bestY && node.x === bestX && currentWaste < minWasteInSpot)) {
                                     minHeightDifference = currentHeightDifference; bestY = node.y; bestX = node.x; minWasteInSpot = currentWaste;
                                     bestFitSheetIndex = i; bestFitNodeIndex = j; bestOrientation = { width: piece.height, height: piece.width };
                                 }
                             }
                         }
                     }

                     if (bestFitSheetIndex !== -1) {
                         piece.placedWidth = bestOrientation.width; piece.placedHeight = bestOrientation.height;
                         placePieceInNodeInStrip(piece, sheets[bestFitSheetIndex], bestFitNodeIndex, kerf, margin);
                         console.log(`Piece ${piece.id} placed in best fit existing node on sheet ${bestFitSheetIndex + 1}.`);
                     } else {
                         let placedInNewStrip = false;
                         for (let i = 0; i < sheets.length; i++) {
                             const sheet = sheets[i];
                             const newStripY = (sheet.placedPieces.length > 0 ? sheet.currentStripY + kerf : margin);
                             const potentialNewStripHeight = piece.height;
                             if (newStripY + potentialNewStripHeight <= sheetHeight - margin) {
                                  let newStripOrientation = { width: piece.width, height: piece.height };
                                  if (!sheetHasGrain) {
                                       if (piece.height <= usableWidth && piece.width <= usableHeight) {
                                            if (usableWidth - piece.height < usableWidth - piece.width) {
                                                 newStripOrientation = { width: piece.height, height: piece.width };
                                            }
                                       }
                                  }
                                  if (newStripOrientation.width <= usableWidth && newStripOrientation.height <= (sheetHeight - margin - newStripY)) {
                                       const newStripNode = { x: margin, y: newStripY, width: usableWidth, height: newStripOrientation.height, area: usableWidth * newStripOrientation.height };
                                       sheet.freeRectangles.push(newStripNode);
                                       sheet.freeRectangles.sort((a, b) => { if (a.y !== b.y) return a.y - b.y; return a.x - b.x; });
                                       const newNodeIndex = sheet.freeRectangles.findIndex(node => node.x === margin && node.y === newStripY && node.height === newStripOrientation.height);
                                       if (newNodeIndex !== -1) {
                                           piece.placedWidth = newStripOrientation.width; piece.placedHeight = newStripOrientation.height;
                                           placePieceInNodeInStrip(piece, sheet, newNodeIndex, kerf, margin);
                                           placedInNewStrip = true;
                                           console.log(`Piece ${piece.id} placed in new strip on sheet ${i + 1}.`);
                                           break;
                                       }
                                  }
                             }
                         }
                         if (!placedInNewStrip) {
                              let newSheetOrientation = { width: piece.width, height: piece.height };
                              const fitsInOriginalNewSheet = (piece.width <= usableWidth && piece.height <= usableHeight);
                              const fitsInRotatedNewSheet = (!sheetHasGrain && piece.height <= usableWidth && piece.width <= usableHeight);
                              if (!fitsInOriginalNewSheet && !fitsInRotatedNewSheet) { showMessage(`Pieza ${piece.id} (${piece.width}x${piece.height}) es más grande que el área útil de la plancha (${usableWidth}x${usableHeight}) con margen ${margin} en cualquier orientación permitida. No se puede colocar.`, 'error', 7000); piece.placed = false; console.warn(`Piece ${piece.id} is too large to place.`); return; }

                              if (!sheetHasGrain && fitsInOriginalNewSheet && fitsInRotatedNewSheet) { if (usableWidth - piece.height < usableWidth - piece.width) newSheetOrientation = { width: piece.height, height: piece.width }; }
                              else if (!sheetHasGrain && fitsInRotatedNewSheet && !fitsInOriginalNewSheet) { newSheetOrientation = { width: piece.height, height: piece.width }; }

                             const newSheet = {
                                 width: sheetWidth, height: sheetHeight, placedPieces: [],
                                 freeRectangles: [{ x: margin, y: margin, width: usableWidth, height: newSheetOrientation.height }],
                                 usefulArea: 0, wasteArea: sheetWidth * sheetHeight,
                                 currentStripY: margin + newSheetOrientation.height
                             };
                             sheets.push(newSheet);
                             const targetNode = newSheet.freeRectangles[0];
                             if (newSheetOrientation.width <= targetNode.width && newSheetOrientation.height <= targetNode.height) {
                                 piece.placedWidth = newSheetOrientation.width; piece.placedHeight = newSheetOrientation.height;
                                 placePieceInNodeInStrip(piece, newSheet, 0, kerf, margin);
                                 console.log(`Piece ${piece.id} placed on a new sheet.`);
                             } else { console.error("Optimizador Error: Piece cannot fit in the initial strip of a new sheet."); piece.placed = false; }
                         }
                     }
                }
            });

            const unplacedPieces = piecesToCut.filter(p => !p.placed);
            if(unplacedPieces.length > 0){ showMessage(`${unplacedPieces.length} pieza(s) no pudieron ser colocadas. Revisa si son más grandes que el área útil de la plancha o si hay demasiadas piezas pequeñas.`, 'info', 6000); console.warn(`${unplacedPieces.length} pieces unplaced.`); }

            sheets.forEach(sheet => {
                sheet.usefulArea = sheet.placedPieces.reduce((sum, p) => sum + (p.placedWidth * p.placedHeight), 0);
                sheet.wasteArea = (sheet.width * sheet.height) - sheet.usefulArea;
            });

            summaryElement.className = 'bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded relative mb-6';
            summaryElement.innerText = `Planchas Necesarias: ${sheets.length}. ${unplacedPieces.length > 0 ? `(${unplacedPieces.length} piezas no colocadas)` : ''}`;
            console.log(`Optimization complete. ${sheets.length} sheets used.`);

            drawSheets(sheets, kerf, margin);

        }

        /**
         * Places a piece into a specific free rectangle (node) within a strip on a sheet
         * and updates the sheet's free rectangles list for that strip (Optimizador).
         * @param {Piece} piece The piece object to place.
         * @param {Sheet} sheet The sheet object to place the piece on.
         * @param {number} nodeIndex The index of the free rectangle node (segment) in sheet.freeRectangles.
         * @param {number} kerf The saw kerf width (used for splitting).
         * @param {number} margin The margin width.
         */
        function placePieceInNodeInStrip(piece, sheet, nodeIndex, kerf, margin) {
             console.log(`Placing piece ${piece.id} at node ${nodeIndex} on sheet index ${sheets.indexOf(sheet)}`);
             const node = sheet.freeRectangles[nodeIndex];
             if (!node) { console.error(`Optimizador Node at index ${nodeIndex} not found.`); return; }

            piece.x = node.x;
            piece.y = node.y;
            const sheetIndex = sheets.indexOf(sheet);
             if (sheetIndex === -1) { console.error("Optimizador Error: Could not find the sheet index for piece placement!"); return; }
            piece.sheetIndex = sheetIndex;
            piece.placed = true;
            sheet.placedPieces.push(piece);

            const newNodes = [];
            const remainingWidth = node.width - piece.placedWidth - kerf;
            const remainingHeight = node.height;

            if (remainingWidth > kerf/2 && remainingHeight > kerf/2) {
                newNodes.push({ x: node.x + piece.placedWidth + kerf, y: node.y, width: remainingWidth, height: remainingHeight, area: remainingWidth * remainingHeight });
            }

            sheet.freeRectangles.splice(nodeIndex, 1, ...newNodes);
            console.log(`Node ${nodeIndex} replaced with ${newNodes.length} new nodes.`);

            const pieceBottomY = piece.y + piece.placedHeight;
            if (pieceBottomY > sheet.currentStripY) sheet.currentStripY = pieceBottomY;
            console.log(`Updated currentStripY for sheet ${sheetIndex} to ${sheet.currentStripY}.`);


             mergeAdjacentNodes(sheet.freeRectangles, kerf);
             console.log("Merged adjacent nodes.");
        }


        /**
         * Merges adjacent or overlapping free rectangles (segments within strips) in a sheet's list (Optimizador).
         * @param {Array<FreeRectangle>} nodes The array of free rectangle nodes to modify in place.
         * @param {number} kerf The saw kerf width (used for tolerance check).
         */
        function mergeAdjacentNodes(nodes, kerf) {
             console.log("Merging adjacent nodes. Initial nodes:", nodes.length);
             nodes.sort((a, b) => { if (a.y !== b.y) return a.y - b.y; return a.x - b.x; });
             let mergedOccurred;
             do {
                 mergedOccurred = false;
                 const nextNodes = [];
                 const nodesToProcess = [...nodes];
                 nodes.length = 0; // Clear the original array

                 while(nodesToProcess.length > 0) {
                      const nodeA = nodesToProcess.shift();
                      for (let i = 0; i < nodesToProcess.length; i++) {
                          const nodeB = nodesToProcess[i];
                           // Check if nodes are on the same Y level (within kerf tolerance) and are horizontally adjacent
                           if (Math.abs(nodeA.y - nodeB.y) < kerf / 2 && Math.abs(nodeA.height - nodeB.height) < kerf / 2 && Math.abs(nodeA.x + nodeA.width + kerf - nodeB.x) < kerf / 2) {
                               console.log(`Merging nodes at (${nodeA.x}, ${nodeA.y}) and (${nodeB.x}, ${nodeB.y})`);
                               nodeA.width += nodeB.width + kerf; // Merge widths, accounting for kerf between them
                               nodeA.area = nodeA.width * nodeA.height;
                               nodesToProcess.splice(i, 1); // Remove nodeB
                               mergedOccurred = true;
                               i--; // Decrement index because array length decreased
                          }
                      }
                      nextNodes.push(nodeA); // Add the processed nodeA (potentially merged) to the next list
                 }
                 nodes.push(...nextNodes); // Replace original nodes with the merged list
             } while(mergedOccurred);
             console.log("Merging complete. Final nodes:", nodes.length);
        }


        // Assigns a consistent color to pieces from the same original input row (Optimizador).
        const pieceColorCache = {};
        // Palette of light gray shades
        const colorPalette = [
            '#f0f0f0', '#e0e0e0', '#d0d0d0', '#c0c0c0', '#b0b0b0',
            '#f5f5f5', '#ebebeb', '#dcdcdc', '#cccccc', '#b8b8b8'
        ];

        /**
         * Gets a consistent color for a piece based on its original input index (Optimizador).
         * @param {number} originalIndex The index of the piece definition in the input list.
         * @returns {string} A hex color string.
         */
        function getPieceColor(originalIndex) {
            if (pieceColorCache[originalIndex]) return pieceColorCache[originalIndex];
            const color = colorPalette[originalIndex % colorPalette.length];
            pieceColorCache[originalIndex] = color;
            return color;
        }


        /**
         * Draws the sheets and the placed pieces onto canvas elements (Optimizador).
         * @param {Array<Sheet>} sheetsData Array of sheet objects.
         * @param {number} kerf The saw kerf width for drawing line thickness.
         * @param {number} margin The margin width for drawing the margin area.
         */
        function drawSheets(sheetsData, kerf, margin) {
            console.log("Drawing sheets.");
            const visualsContainer = document.getElementById('sheetVisuals');
             if (!visualsContainer) { console.error("Optimizador Sheet visuals container not found!"); return; }
            visualsContainer.innerHTML = '';

            if (sheetsData.length === 0) {
                console.log("No sheets to draw.");
                return;
            }

            const patternCanvas = document.createElement('canvas');
            const patternSize = 20;
            patternCanvas.width = patternSize; patternCanvas.height = patternSize;
            const patternCtx = patternCanvas.getContext('2d');
            if (patternCtx) { patternCtx.strokeStyle = 'rgba(128, 128, 128, 0.3)'; patternCtx.lineWidth = 1; patternCtx.beginPath(); patternCtx.moveTo(0, patternSize); patternCtx.lineTo(patternSize, 0); patternCtx.stroke(); }
            else { console.error("Optimizador Could not create pattern canvas context."); }


            sheetsData.forEach((sheet, index) => {
                console.log(`Drawing sheet ${index + 1}.`);
                const sheetResultDiv = document.createElement('div');
                sheetResultDiv.className = 'sheet-result border border-gray-300 p-4 rounded-lg bg-white shadow-sm';

                const sheetTitle = document.createElement('h3');
                sheetTitle.className = 'text-lg font-semibold text-blue-700 mb-2';
                sheetTitle.textContent = `Plancha ${index + 1} de ${sheetsData.length}`;
                sheetResultDiv.appendChild(sheetTitle);

                const sheetSummary = document.createElement('p');
                sheetSummary.className = 'sheet-summary text-sm text-gray-600 mb-3';
                const totalSheetArea = sheet.width * sheet.height;
                const utilizationPercentage = totalSheetArea > 0 ? ((sheet.usefulArea / totalSheetArea) * 100).toFixed(1) : 0;
                const wastePercentage = totalSheetArea > 0 ? ((sheet.wasteArea / totalSheetArea) * 100).toFixed(1) : 0;
                sheetSummary.textContent = `Utilización: ${utilizationPercentage}%. Desperdicio: ${wastePercentage}%.`;
                sheetResultDiv.appendChild(sheetSummary);

                const canvas = document.createElement('canvas');
                canvas.width = sheet.width; canvas.height = sheet.height;
                canvas.style.aspectRatio = `${sheet.width} / ${sheet.height}`;
                sheetResultDiv.appendChild(canvas);
                visualsContainer.appendChild(sheetResultDiv);

                const ctx = canvas.getContext('2d');
                 if (!ctx) { console.error(`Optimizador Could not get 2D context for canvas on sheet ${index + 1}.`); return; }

                ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, sheet.width, sheet.height);
                ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, sheet.width, sheet.height);

                if (margin > 0) {
                    ctx.fillStyle = '#e0e0e0';
                    ctx.fillRect(0, 0, sheet.width, margin); ctx.fillRect(0, sheet.height - margin, sheet.width, margin);
                    ctx.fillRect(0, margin, margin, sheet.height - 2 * margin); ctx.fillRect(sheet.width - margin, margin, margin, sheet.height - 2 * margin);
                }

                 if (patternCtx) {
                    const wastePattern = ctx.createPattern(patternCanvas, 'repeat');
                    if (wastePattern) {
                         ctx.fillStyle = wastePattern;
                         sheet.freeRectangles.forEach((rect) => { ctx.fillRect(rect.x, rect.y, rect.width, rect.height); });
                    } else { console.error("Optimizador Could not create waste pattern."); ctx.fillStyle = 'rgba(128, 128, 128, 0.1)'; sheet.freeRectangles.forEach((rect) => { ctx.fillRect(rect.x, rect.y, rect.width, rect.height); }); }
                 } else { ctx.fillStyle = 'rgba(128, 128, 128, 0.1)'; sheet.freeRectangles.forEach((rect) => { ctx.fillRect(rect.x, rect.y, rect.width, rect.height); }); }

                 sheet.placedPieces.forEach(piece => {
                     ctx.fillStyle = getPieceColor(piece.originalIndex) + '80';
                     ctx.fillRect(piece.x, piece.y, piece.placedWidth, piece.placedHeight);
                 });

                 sheet.placedPieces.forEach(piece => {
                      ctx.strokeStyle = 'black'; ctx.lineWidth = 1;
                      ctx.strokeRect(piece.x, piece.y, piece.placedWidth, piece.placedHeight);

                      const minFontSize = 16;
                      const fontSize = Math.max(minFontSize, Math.min(piece.placedHeight * 0.35, piece.placedWidth * 0.35, 35));
                       const label = `${piece.width}x${piece.height}`;
                       ctx.font = `bold ${fontSize}px Arial`;
                       const measuredText = ctx.measureText(label);
                       const measuredTextWidth = measuredText.width;
                       const measuredTextHeight = measuredText.actualBoundingBoxAscent + measuredText.actualBoundingBoxDescent;
                       const availableWidthForText = piece.placedWidth;
                       const availableHeightForText = piece.placedHeight;
                       const paddingFactor = 0.05;

                       if (measuredTextWidth < availableWidthForText * (1 - paddingFactor * 2) && measuredTextHeight < availableHeightForText * (1 - paddingFactor * 2)) {
                           ctx.fillStyle = '#000000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                           ctx.fillText(label, piece.x + piece.placedWidth / 2, piece.y + piece.placedHeight / 2);
                       } else {
                            const widthLabel = `${piece.width}`; const heightLabel = `${piece.height}`;
                            ctx.font = `bold ${fontSize}px Arial`;
                            const measuredWidthLabel = ctx.measureText(widthLabel); const measuredWidthLabelWidth = measuredWidthLabel.width;
                            const measuredHeightLabel = ctx.measureText(heightLabel); const measuredHeightLabelWidth = measuredHeightLabel.width;
                            const currentTextHeight = ctx.measureText('M').width;

                            if (measuredWidthLabelWidth < availableWidthForText * (1 - paddingFactor * 2) && currentTextHeight * 2 < availableHeightForText * (1 - paddingFactor * 2) && measuredHeightLabelWidth < availableWidthForText * (1 - paddingFactor * 2)) {
                                ctx.fillStyle = '#000000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                                const lineHeight = currentTextHeight * 1.5; const startY = piece.y + piece.placedHeight / 2 - lineHeight / 2;
                                ctx.fillText(widthLabel, piece.x + piece.placedWidth / 2, startY);
                                ctx.fillText(heightLabel, piece.x + piece.placedWidth / 2, startY + lineHeight);
                            }
                       }
                 });
                 console.log(`Finished drawing sheet ${index + 1}.`);
            });
             console.log('All sheets drawn.');
        }


        // ======================================================================
        // Initialization
        // ======================================================================

        // This function will be called when the DOM is fully loaded.
        document.addEventListener('DOMContentLoaded', async function() {
             console.log("DOMContentLoaded event fired. Initializing integrated app...");

             // Initialize IndexedDB for Cotizador
             try {
                 console.log("Initializing IndexedDB...");
                 await openDatabase();
                 console.log("IndexedDB initialized.");
                 console.log("Loading prices...");
                 await cargarPrecios();
                 console.log("Prices loaded.");
                 console.log("Loading saved quotes...");
                 await cargarCotizacionesGuardadas();
                 console.log("Saved quotes loaded.");
                 console.log("Cotizador IndexedDB and data loading complete.");
             } catch (e) {
                 console.error("Error during Cotizador IndexedDB initialization:", e);
                 showMessage("Error al inicializar la base de datos local del Cotizador.", 'error');
             }

             // Initial setup for Cotizador dynamic items
             // These will be added only if the Cotizador tab is the initial active tab or when it's switched to
             // Let's add them unconditionally on DOMContentLoaded for simplicity, as they only affect the Cotizador tab's UI
             console.log("Adding initial Cotizador dynamic items...");
             agregarTableroItem();
             agregarCantoItem();
             agregarHerrajeItem('correderas');
             agregarHerrajeItem('bisagras');
             agregarHerrajeItem('tiradores');
             agregarHerrajeItem('otros');
             console.log("Initial Cotizador dynamic items added.");


            // Add initial piece row for Optimizador
             const optimizadorPieceTableBody = document.querySelector('#optimizador #pieceTable tbody');
              if (optimizadorPieceTableBody && optimizadorPieceTableBody.children.length === 0) {
                 console.log("Adding initial Optimizador piece row...");
                 addPiece(); // Add default row only if table is empty
                 console.log("Initial Optimizador piece row added.");
              }


             // Attach Cotizador event listeners
             console.log("Attaching Cotizador event listeners...");
             const btnAgregar = document.getElementById('btn-agregar');
             if(btnAgregar) {
                 btnAgregar.addEventListener('click', function() {
                     console.log("Btn Agregar clicked.");
                      const nombre = document.getElementById('nombre').value.trim();
                       const cantidadMueble = parseInt(document.getElementById('cantidad-mueble').value) || 1;
                       const transporte = parseFloat(document.getElementById('cotizador-costo-transporte').value) || 0; // Corrected ID
                       const instalacion = parseFloat(document.getElementById('cotizador-costo-instalacion').value) || 0; // Corrected ID

                      if (!nombre) { alert('Por favor ingresa un nombre para el mueble'); return; }
                      if (cantidadMueble <= 0) { alert('La cantidad de muebles debe ser al menos 1'); return; }

                      const tableros = [];
                       const tablerosContainer = document.getElementById('current-mueble-tableros-container');
                       if (tablerosContainer) {
                           tablerosContainer.querySelectorAll('.herraje-item').forEach(item => {
                               const select = item.querySelector('select'); const cantidadInput = item.querySelector('input[type="number"]'); const customInputsDiv = item.querySelector('.custom-material-inputs');
                               if (select && cantidadInput && customInputsDiv) {
                                   const selectedValue = select.value;
                                   if (selectedValue === 'custom') {
                                       const customNombre = customInputsDiv.querySelector('.custom-nombre').value.trim(); const customPrecio = parseFloat(customInputsDiv.querySelector('.custom-precio').value) || 0; const customCantidad = parseFloat(customInputsDiv.querySelector('.custom-cantidad').value) || 0;
                                       if (customNombre && customPrecio > 0 && customCantidad > 0) tableros.push({ nombre: customNombre, precio: customPrecio, cantidad: customCantidad });
                                   } else if (selectedValue && materiales.tableros[selectedValue]) { const cantidad = parseFloat(cantidadInput.value) || 0; if (cantidad > 0) tableros.push({ tipo: selectedValue, cantidad: cantidad }); }
                               }
                           });
                       }

                       const cantos = [];
                       const cantosContainer = document.getElementById('current-mueble-cantos-container');
                       if (cantosContainer) {
                           cantosContainer.querySelectorAll('.herraje-item').forEach(item => {
                               const select = item.querySelector('select'); const cantidadInput = item.querySelector('input[type="number"]'); const customInputsDiv = item.querySelector('.custom-material-inputs');
                                if (select && cantidadInput && customInputsDiv) {
                                     const selectedValue = select.value;
                                     if (selectedValue === 'custom') {
                                         const customNombre = customInputsDiv.querySelector('.custom-nombre').value.trim(); const customPrecio = parseFloat(customInputsDiv.querySelector('.custom-precio').value) || 0; const customCantidad = parseFloat(customInputsDiv.querySelector('.custom-cantidad').value) || 0;
                                         if (customNombre && customPrecio > 0 && customCantidad > 0) cantos.push({ nombre: customNombre, precio: customPrecio, cantidad: customCantidad });
                                     } else if (selectedValue && materiales.cantos[selectedValue]) { const cantidad = parseFloat(cantidadInput.value) || 0; if (cantidad > 0) cantos.push({ tipo: selectedValue, cantidad: cantidad }); }
                                }
                           });
                       }

                       const herrajes = [];
                       document.querySelectorAll('.current-mueble-section .herraje-categoria').forEach(categoriaDiv => {
                           const container = categoriaDiv.querySelector('.dynamic-items-container');
                           if (container) {
                               const categoria = container.id.replace('current-mueble-', '').replace('-container', '');
                               container.querySelectorAll('.herraje-item').forEach(item => {
                                   const select = item.querySelector('select'); const cantidadInput = item.querySelector('input[type="number"]'); const customInputsDiv = item.querySelector('.custom-material-inputs');
                                    if (select && cantidadInput && customInputsDiv) {
                                        const selectedValue = select.value;
                                        if (selectedValue === 'custom') {
                                            const customNombre = customInputsDiv.querySelector('.custom-nombre').value.trim(); const customPrecio = parseFloat(customInputsDiv.querySelector('.custom-precio').value) || 0; const customCantidad = parseFloat(customInputsDiv.querySelector('.custom-cantidad').value) || 0;
                                            if (customNombre && customPrecio > 0 && customCantidad > 0) herrajes.push({ nombre: customNombre, precio: customPrecio, cantidad: customCantidad });
                                        } else if (selectedValue && materiales.herrajes[categoria] && materiales.herrajes[categoria][selectedValue]) { const cantidad = parseFloat(cantidadInput.value) || 0; if (cantidad > 0) herrajes.push({ categoria: categoria, tipo: selectedValue, cantidad: cantidad }); }
                                    }
                               });
                           }
                       });

                      if (tableros.length === 0 && cantos.length === 0 && herrajes.length === 0 && transporte === 0 && instalacion === 0) { alert('Debes ingresar al menos un material, canto, herraje o costo adicional para agregar el mueble'); return; }

                      const nuevoMueble = { nombre, cantidad: cantidadMueble, tableros, cantos, herrajes, transporte, instalacion };
                      muebles.push(nuevoMueble);
                      actualizarListaMuebles();

                      document.getElementById('nombre').value = ''; document.getElementById('cantidad-mueble').value = '1';
                      const cotizadorTransporteInput = document.getElementById('cotizador-costo-transporte');
                      if (cotizadorTransporteInput) cotizadorTransporteInput.value = '0';
                      const cotizadorInstalacionInput = document.getElementById('cotizador-costo-instalacion');
                      if (cotizadorInstalacionInput) cotizadorInstalacionInput.value = '0';


                      document.querySelectorAll('.current-mueble-section .dynamic-items-container').forEach(container => { container.innerHTML = ''; });
                      agregarTableroItem(); agregarCantoItem(); agregarHerrajeItem('correderas'); agregarHerrajeItem('bisagras'); agregarHerrajeItem('tiradores'); agregarHerrajeItem('otros');

                      document.getElementById('nombre').focus();
                      showMessage('Mueble agregado correctamente.', 'success');
                 });
             } else { console.error("Btn Agregar not found."); }


             const btnGenerarPdf = document.getElementById('btn-generar-pdf');
             if(btnGenerarPdf) btnGenerarPdf.addEventListener('click', generarPDF); else { console.error("Btn Generar PDF not found."); }

             const btnActualizarPrecios = document.getElementById('btn-actualizar-precios');
             if(btnActualizarPrecios) btnActualizarPrecios.addEventListener('click', mostrarFormularioPrecios); else { console.error("Btn Actualizar Precios not found."); }

             const btnGenerarListaMateriales = document.getElementById('btn-generar-lista-materiales');
             if(btnGenerarListaMateriales) btnGenerarListaMateriales.addEventListener('click', generarListaMateriales); else { console.error("Btn Generar Lista Materiales not found."); }

             const btnExportarListaMaterialesPdf = document.getElementById('btn-exportar-lista-materiales-pdf');
             if(btnExportarListaMaterialesPdf) btnExportarListaMaterialesPdf.addEventListener('click', generarPDFListaMateriales); else { console.error("Btn Exportar Lista Materiales PDF not found."); }

             const btnGuardarCotizacion = document.getElementById('btn-guardar-cotizacion');
             if(btnGuardarCotizacion) btnGuardarCotizacion.addEventListener('click', guardarCotizacionActual); else { console.error("Btn Guardar Cotizacion not found."); }

             const btnExportarCotizaciones = document.getElementById('btn-exportar-cotizaciones');
             if(btnExportarCotizaciones) btnExportarCotizaciones.addEventListener('click', exportarCotizaciones); else { console.error("Btn Exportar Cotizaciones not found."); }

             const inputImportarCotizaciones = document.getElementById('input-importar-cotizaciones');
             if(inputImportarCotizaciones) inputImportarCotizaciones.addEventListener('change', importarCotizaciones); else { console.error("Input Importar Cotizaciones not found."); }

             const inputGanancia = document.getElementById('ganancia');
             if(inputGanancia) inputGanancia.addEventListener('change', actualizarListaMuebles); else { console.error("Input Ganancia not found."); }

              const inputDescuento = document.getElementById('descuento');
              if(inputDescuento) inputDescuento.addEventListener('change', actualizarListaMuebles); else { console.error("Input Descuento not found."); }

             console.log("Cotizador event listeners attached.");


             // Attach Optimizador event listeners
             console.log("Attaching Optimizador event listeners...");
             const btnOptimizeCuts = document.getElementById('btnOptimizeCuts'); // Use ID for event listener
              if(btnOptimizeCuts) btnOptimizeCuts.addEventListener('click', optimizeCuts); else { console.error("Btn Optimize Cuts not found."); }

             const btnAddPiece = document.getElementById('btnAddPiece'); // Use ID for event listener
              if(btnAddPiece) btnAddPiece.addEventListener('click', addPiece); else { console.error("Btn Add Piece not found."); }

             console.log("Optimizador event listeners attached.");


             // Initial display: open the first tab by default
             console.log("Activating initial tab.");
             const firstTabButton = document.querySelector('.tab-button');
             if(firstTabButton) {
                 firstTabButton.click(); // Simulate a click on the first tab button
                 console.log("Initial tab activated.");
             } else {
                 console.error("First tab button not found.");
             }


             console.log("DOMContentLoaded execution finished.");

        });
