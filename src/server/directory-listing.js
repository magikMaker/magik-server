/**
 * Directory listing functionality for magik-server
 * @module magik-server/directory-listing
 */

import fs from 'fs';
import path from 'path';
import { red } from 'barva';
import { formatFileSize, formatDate } from '../utils/index.js';

/**
 * Create HTML for directory listing
 * @param {Object} responseObj - Response object
 * @param {Function} callback - Callback function to receive HTML content
 */
export function createDirectoryListing(responseObj, callback) {
  const dirPath = responseObj.filePath;
  const requestPath = responseObj.pathName;

  fs.readdir(dirPath, (error, files) => {
    if (error) {
      console.log(red`ERROR reading directory:`, error);
      callback('<p class="error">Error reading directory</p>');
      return;
    }

    let html = '<table class="listing">';
    html += '<tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th></tr>';

    // Add parent directory link if not at root
    if (requestPath !== '/') {
      const parentPath = requestPath.substring(0, requestPath.slice(0, -1).lastIndexOf('/') + 1);
      html += `<tr>
        <td><a href="${parentPath}">..</a></td>
        <td>Directory</td>
        <td>-</td>
        <td>-</td>
      </tr>`;
    }

    // Process all files/directories
    const processFiles = files
      .filter(file => {
        // Filter hidden files if not showing them
        const isHidden = file.charAt(0) === '.';
        return responseObj.config.hidden || !isHidden;
      })
      .map(file => {
        const filePath = path.join(dirPath, file);

        return new Promise(resolve => {
          fs.stat(filePath, (err, stats) => {
            if (err) {
              resolve(null);
              return;
            }

            const isDir = stats.isDirectory();
            const fileName = isDir ? file + '/' : file;
            const fileType = isDir ? 'Directory' : 'File';
            const fileSize = isDir ? '-' : formatFileSize(stats.size);
            const modifiedDate = formatDate(stats.mtime);

            resolve({
              name: fileName,
              path: path.posix.join(requestPath, fileName),
              type: fileType,
              size: fileSize,
              modified: modifiedDate,
              isDir: isDir
            });
          });
        });
      });

    Promise.all(processFiles)
      .then(fileInfos => {
        fileInfos = fileInfos.filter(info => info !== null);

        // Sort directories first, then files
        fileInfos.sort((a, b) => {
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        });

        fileInfos.forEach(info => {
          html += `<tr>
            <td><a href="${info.path}">${info.name}</a></td>
            <td>${info.type}</td>
            <td>${info.size}</td>
            <td>${info.modified}</td>
          </tr>`;
        });

        html += '</table>';
        callback(html);
      })
      .catch(err => {
        console.log(red`ERROR processing files:`, err);
        callback('<p class="error">Error processing directory contents</p>');
      });
  });
}
