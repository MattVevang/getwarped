/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 157:
/***/ ((module) => {

module.exports = require("electron");

/***/ }),

/***/ 238:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("{\n/**\n * Main process entry point for GetWarped Electron application\n * Handles application lifecycle, window management, and IPC communication\n */\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) {\n      desc = { enumerable: true, get: function() { return m[k]; } };\n    }\n    Object.defineProperty(o, k2, desc);\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {\n    Object.defineProperty(o, \"default\", { enumerable: true, value: v });\n}) : function(o, v) {\n    o[\"default\"] = v;\n});\nvar __importStar = (this && this.__importStar) || (function () {\n    var ownKeys = function(o) {\n        ownKeys = Object.getOwnPropertyNames || function (o) {\n            var ar = [];\n            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;\n            return ar;\n        };\n        return ownKeys(o);\n    };\n    return function (mod) {\n        if (mod && mod.__esModule) return mod;\n        var result = {};\n        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== \"default\") __createBinding(result, mod, k[i]);\n        __setModuleDefault(result, mod);\n        return result;\n    };\n})();\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst electron_1 = __webpack_require__(157);\nconst path = __importStar(__webpack_require__(928));\n/**\n * Create the main application window\n */\nfunction createWindow() {\n    // Create the browser window\n    const mainWindow = new electron_1.BrowserWindow({\n        height: 800,\n        width: 1200,\n        minHeight: 600,\n        minWidth: 800,\n        show: false, // Don't show until ready-to-show\n        webPreferences: {\n            nodeIntegration: false, // Security: Disable node integration\n            contextIsolation: true, // Security: Enable context isolation\n            preload: path.join(__dirname, '../renderer/preload.js'), // TODO: Create preload script\n        },\n        titleBarStyle: 'default',\n        icon: path.join(__dirname, '../../assets/icons/icon.png'), // TODO: Add application icon\n    });\n    // Load the renderer process\n    if (false) // removed by dead control flow\n{}\n    else {\n        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));\n    }\n    // Show window when ready to prevent visual flash\n    mainWindow.once('ready-to-show', () => {\n        mainWindow.show();\n    });\n    // Handle window closed\n    mainWindow.on('closed', () => {\n        // Dereference the window object\n        // Usually you would store windows in an array if your app supports multi windows\n        // This is the time when you should delete the corresponding element.\n    });\n}\n/**\n * This method will be called when Electron has finished initialization\n * and is ready to create browser windows.\n * Some APIs can only be used after this event occurs.\n */\nelectron_1.app.whenReady().then(createWindow);\n/**\n * Quit when all windows are closed, except on macOS.\n * On macOS it is common for applications and their menu bar\n * to stay active until the user quits explicitly with Cmd + Q.\n */\nelectron_1.app.on('window-all-closed', () => {\n    if (process.platform !== 'darwin') {\n        electron_1.app.quit();\n    }\n});\n/**\n * On macOS it's common to re-create a window in the app when the\n * dock icon is clicked and there are no other windows open.\n */\nelectron_1.app.on('activate', () => {\n    if (electron_1.BrowserWindow.getAllWindows().length === 0) {\n        createWindow();\n    }\n});\n/**\n * Security: Prevent new window creation from renderer\n */\nelectron_1.app.on('web-contents-created', (_event, contents) => {\n    contents.setWindowOpenHandler(({ url }) => {\n        // eslint-disable-next-line no-console\n        console.log('Blocked new window creation to:', url);\n        return { action: 'deny' };\n    });\n});\n// TODO: Initialize IPC handlers\n// TODO: Initialize service managers\n// TODO: Setup logging and monitoring\n// TODO: Setup security policies\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMjM4LmpzIiwibWFwcGluZ3MiOiI7QUFBQTs7O0dBR0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsNENBQThDO0FBQzlDLG9EQUE2QjtBQUU3Qjs7R0FFRztBQUNILFNBQVMsWUFBWTtJQUNuQiw0QkFBNEI7SUFDNUIsTUFBTSxVQUFVLEdBQUcsSUFBSSx3QkFBYSxDQUFDO1FBQ25DLE1BQU0sRUFBRSxHQUFHO1FBQ1gsS0FBSyxFQUFFLElBQUk7UUFDWCxTQUFTLEVBQUUsR0FBRztRQUNkLFFBQVEsRUFBRSxHQUFHO1FBQ2IsSUFBSSxFQUFFLEtBQUssRUFBRSxpQ0FBaUM7UUFDOUMsY0FBYyxFQUFFO1lBQ2QsZUFBZSxFQUFFLEtBQUssRUFBRSxxQ0FBcUM7WUFDN0QsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLHFDQUFxQztZQUM3RCxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsRUFBRSw4QkFBOEI7U0FDeEY7UUFDRCxhQUFhLEVBQUUsU0FBUztRQUN4QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsNkJBQTZCLENBQUMsRUFBRSw2QkFBNkI7S0FDekYsQ0FBQyxDQUFDO0lBRUgsNEJBQTRCO0lBQzVCLElBQUksS0FBeUMsRUFBRTtBQUFBLEVBRzlDO1NBQU0sQ0FBQztRQUNOLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRCxpREFBaUQ7SUFDakQsVUFBVSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQ3BDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQztJQUVILHVCQUF1QjtJQUN2QixVQUFVLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxHQUFHLEVBQUU7UUFDM0IsZ0NBQWdDO1FBQ2hDLGlGQUFpRjtRQUNqRixxRUFBcUU7SUFDdkUsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILGNBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFFbkM7Ozs7R0FJRztBQUNILGNBQUcsQ0FBQyxFQUFFLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO0lBQy9CLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxRQUFRLEVBQUUsQ0FBQztRQUNsQyxjQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDYixDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFFSDs7O0dBR0c7QUFDSCxjQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUU7SUFDdEIsSUFBSSx3QkFBYSxDQUFDLGFBQWEsRUFBRSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztRQUMvQyxZQUFZLEVBQUUsQ0FBQztJQUNqQixDQUFDO0FBQ0gsQ0FBQyxDQUFDLENBQUM7QUFFSDs7R0FFRztBQUNILGNBQUcsQ0FBQyxFQUFFLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQUU7SUFDbEQsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFO1FBQ3hDLHNDQUFzQztRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3BELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDNUIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILGdDQUFnQztBQUNoQyxvQ0FBb0M7QUFDcEMscUNBQXFDO0FBQ3JDLGdDQUFnQyIsInNvdXJjZXMiOlsid2VicGFjazovL2dldHdhcnBlZC8uL3NyYy9tYWluL21haW4udHM/MTUzNCJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE1haW4gcHJvY2VzcyBlbnRyeSBwb2ludCBmb3IgR2V0V2FycGVkIEVsZWN0cm9uIGFwcGxpY2F0aW9uXG4gKiBIYW5kbGVzIGFwcGxpY2F0aW9uIGxpZmVjeWNsZSwgd2luZG93IG1hbmFnZW1lbnQsIGFuZCBJUEMgY29tbXVuaWNhdGlvblxuICovXG5cbmltcG9ydCB7IGFwcCwgQnJvd3NlcldpbmRvdyB9IGZyb20gJ2VsZWN0cm9uJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5cbi8qKlxuICogQ3JlYXRlIHRoZSBtYWluIGFwcGxpY2F0aW9uIHdpbmRvd1xuICovXG5mdW5jdGlvbiBjcmVhdGVXaW5kb3coKTogdm9pZCB7XG4gIC8vIENyZWF0ZSB0aGUgYnJvd3NlciB3aW5kb3dcbiAgY29uc3QgbWFpbldpbmRvdyA9IG5ldyBCcm93c2VyV2luZG93KHtcbiAgICBoZWlnaHQ6IDgwMCxcbiAgICB3aWR0aDogMTIwMCxcbiAgICBtaW5IZWlnaHQ6IDYwMCxcbiAgICBtaW5XaWR0aDogODAwLFxuICAgIHNob3c6IGZhbHNlLCAvLyBEb24ndCBzaG93IHVudGlsIHJlYWR5LXRvLXNob3dcbiAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZSwgLy8gU2VjdXJpdHk6IERpc2FibGUgbm9kZSBpbnRlZ3JhdGlvblxuICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSwgLy8gU2VjdXJpdHk6IEVuYWJsZSBjb250ZXh0IGlzb2xhdGlvblxuICAgICAgcHJlbG9hZDogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uL3JlbmRlcmVyL3ByZWxvYWQuanMnKSwgLy8gVE9ETzogQ3JlYXRlIHByZWxvYWQgc2NyaXB0XG4gICAgfSxcbiAgICB0aXRsZUJhclN0eWxlOiAnZGVmYXVsdCcsXG4gICAgaWNvbjogcGF0aC5qb2luKF9fZGlybmFtZSwgJy4uLy4uL2Fzc2V0cy9pY29ucy9pY29uLnBuZycpLCAvLyBUT0RPOiBBZGQgYXBwbGljYXRpb24gaWNvblxuICB9KTtcblxuICAvLyBMb2FkIHRoZSByZW5kZXJlciBwcm9jZXNzXG4gIGlmIChwcm9jZXNzLmVudlsnTk9ERV9FTlYnXSA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgIG1haW5XaW5kb3cubG9hZFVSTCgnaHR0cDovL2xvY2FsaG9zdDo5MDAwJyk7XG4gICAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vcGVuRGV2VG9vbHMoKTtcbiAgfSBlbHNlIHtcbiAgICBtYWluV2luZG93LmxvYWRGaWxlKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9yZW5kZXJlci9pbmRleC5odG1sJykpO1xuICB9XG5cbiAgLy8gU2hvdyB3aW5kb3cgd2hlbiByZWFkeSB0byBwcmV2ZW50IHZpc3VhbCBmbGFzaFxuICBtYWluV2luZG93Lm9uY2UoJ3JlYWR5LXRvLXNob3cnLCAoKSA9PiB7XG4gICAgbWFpbldpbmRvdy5zaG93KCk7XG4gIH0pO1xuXG4gIC8vIEhhbmRsZSB3aW5kb3cgY2xvc2VkXG4gIG1haW5XaW5kb3cub24oJ2Nsb3NlZCcsICgpID0+IHtcbiAgICAvLyBEZXJlZmVyZW5jZSB0aGUgd2luZG93IG9iamVjdFxuICAgIC8vIFVzdWFsbHkgeW91IHdvdWxkIHN0b3JlIHdpbmRvd3MgaW4gYW4gYXJyYXkgaWYgeW91ciBhcHAgc3VwcG9ydHMgbXVsdGkgd2luZG93c1xuICAgIC8vIFRoaXMgaXMgdGhlIHRpbWUgd2hlbiB5b3Ugc2hvdWxkIGRlbGV0ZSB0aGUgY29ycmVzcG9uZGluZyBlbGVtZW50LlxuICB9KTtcbn1cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGNhbGxlZCB3aGVuIEVsZWN0cm9uIGhhcyBmaW5pc2hlZCBpbml0aWFsaXphdGlvblxuICogYW5kIGlzIHJlYWR5IHRvIGNyZWF0ZSBicm93c2VyIHdpbmRvd3MuXG4gKiBTb21lIEFQSXMgY2FuIG9ubHkgYmUgdXNlZCBhZnRlciB0aGlzIGV2ZW50IG9jY3Vycy5cbiAqL1xuYXBwLndoZW5SZWFkeSgpLnRoZW4oY3JlYXRlV2luZG93KTtcblxuLyoqXG4gKiBRdWl0IHdoZW4gYWxsIHdpbmRvd3MgYXJlIGNsb3NlZCwgZXhjZXB0IG9uIG1hY09TLlxuICogT24gbWFjT1MgaXQgaXMgY29tbW9uIGZvciBhcHBsaWNhdGlvbnMgYW5kIHRoZWlyIG1lbnUgYmFyXG4gKiB0byBzdGF5IGFjdGl2ZSB1bnRpbCB0aGUgdXNlciBxdWl0cyBleHBsaWNpdGx5IHdpdGggQ21kICsgUS5cbiAqL1xuYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICdkYXJ3aW4nKSB7XG4gICAgYXBwLnF1aXQoKTtcbiAgfVxufSk7XG5cbi8qKlxuICogT24gbWFjT1MgaXQncyBjb21tb24gdG8gcmUtY3JlYXRlIGEgd2luZG93IGluIHRoZSBhcHAgd2hlbiB0aGVcbiAqIGRvY2sgaWNvbiBpcyBjbGlja2VkIGFuZCB0aGVyZSBhcmUgbm8gb3RoZXIgd2luZG93cyBvcGVuLlxuICovXG5hcHAub24oJ2FjdGl2YXRlJywgKCkgPT4ge1xuICBpZiAoQnJvd3NlcldpbmRvdy5nZXRBbGxXaW5kb3dzKCkubGVuZ3RoID09PSAwKSB7XG4gICAgY3JlYXRlV2luZG93KCk7XG4gIH1cbn0pO1xuXG4vKipcbiAqIFNlY3VyaXR5OiBQcmV2ZW50IG5ldyB3aW5kb3cgY3JlYXRpb24gZnJvbSByZW5kZXJlclxuICovXG5hcHAub24oJ3dlYi1jb250ZW50cy1jcmVhdGVkJywgKF9ldmVudCwgY29udGVudHMpID0+IHtcbiAgY29udGVudHMuc2V0V2luZG93T3BlbkhhbmRsZXIoKHsgdXJsIH0pID0+IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKCdCbG9ja2VkIG5ldyB3aW5kb3cgY3JlYXRpb24gdG86JywgdXJsKTtcbiAgICByZXR1cm4geyBhY3Rpb246ICdkZW55JyB9O1xuICB9KTtcbn0pO1xuXG4vLyBUT0RPOiBJbml0aWFsaXplIElQQyBoYW5kbGVyc1xuLy8gVE9ETzogSW5pdGlhbGl6ZSBzZXJ2aWNlIG1hbmFnZXJzXG4vLyBUT0RPOiBTZXR1cCBsb2dnaW5nIGFuZCBtb25pdG9yaW5nXG4vLyBUT0RPOiBTZXR1cCBzZWN1cml0eSBwb2xpY2llc1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///238\n\n}");

/***/ }),

/***/ 928:
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(238);
/******/ 	
/******/ })()
;