var bytes = require('bytes'),
    he = require('he'),
    fs = require('fs'),
    fsPath = require('path');

function generateDateString(date){
    var text = '',
        date = new Date(date),
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function pad(str){
        return str.toString().length === 1 ? '0'+str : str;
    }

    text += pad(date.getDate());
    text += '-';
    text += months[date.getMonth()];
    text += '-';
    text += date.getFullYear();
    text += ' ';
    text += pad(date.getHours());
    text += ':';
    text += pad(date.getMinutes())
    return text;
}

/**
 * Creates a directory listing and returns the HTML for it
 *
 * @param {Stint} path the path to the directory
 * @returns {String} the HTML
 */
module.exports = function(responseObject, serverCallback) {
    var path = fsPath.normalize(responseObject.documentRoot + fsPath.sep + responseObject.parsedUrl.pathname),
        fileList = fs.readdirSync(path);

    // remove hidden files?
    if(!responseObject.config.hidden) {
        fileList = fileList.filter(function(element) {
            return !element.match(/^\./);
        });
    }

    // sort by directory and file
    sortFilesByType(fileList, function(errors, dirs, files) {
        // console.log('done', errors, dirs, files);
        var html = '';

        // TODO how to handle errors?
        if(errors.length > 0) {
            console.log('ERROR: sorting directory files'.red);
            html = '<p><strong>an error occurred</strong></p>';
        } else {
            html = createHtml(dirs, files);
        }

        serverCallback(html);
    });

    /**
     * Iterates over fileList and splits items into two arrays, one with
     * directories, one with files. Calls `callback` when all done.
     *
     * @param fileList
     * @param callback
     * @returns {*}
     */
    function sortFilesByType(fileList, callback) {
        var pending = fileList.length,
            errors = [],
            dirs = [],
            files = [];

        if(!pending) {
            return callback(errors, dirs, files);
        }

        fileList.forEach(function(file) {

            fs.stat(fsPath.join(path, file), function(error, stat) {

                if(error) {
                    errors.push(err);
                }
                else if(stat.isDirectory()) {
                    dirs.push([file, stat]);
                }
                else {
                    files.push([file, stat]);
                }

                if(--pending === 0) {
                    callback(errors, dirs, files);
                }
            });
        });
    }

    /**
     * Creates HTML for the file list
     * @param fileList
     * @returns {string}
     */
    function createHtml(dirs, files) {
        var html = '',
            heading,
            parentLink = '',
            relativePath = fsPath.normalize('/' + path.slice(responseObject.documentRoot.length));

        // display the link to the parent directory and remove last / for heading
        if(relativePath !== '/'){
            parentLink = '<tr class="directory"><td><a href="'+fsPath.normalize(relativePath + '/../')+'">..</a></td><td colspan="2">&nbsp;</td></tr>';
            heading = relativePath.replace(/\/$/, '');
        }

        html += '<h1>Index of ' + (heading || relativePath) + '</h1>\n';
        html += '<table class="directory-listing">\n';

        // table header
        html += '<tr>';
        html += '<th>name</th>';
        html += '<th>size</th>';
        html += '<th>last modified</th>';
        html += '</tr>\n';

        html += parentLink;

        /**
         * writes a row to the table HTML
         */
        function writeRow(file){
            //console.log('file', file);
            var isDir = file[1].isDirectory();

            html += '<tr class="' + (isDir ? 'directory' : 'file') + '">\n';

            // name
            html += '<td class="name">';
            html += '<a href="'+fsPath.normalize(relativePath + '/' + file[0])+'">' + he.encode(file[0]) + ((isDir)? '/':'') + '</a>';
            html += '</td>\n';

            // size
            html += '<td class="file-size">';
            html += isDir ? '-' : bytes(file[1].size);
            html += '</td>\n';

            // last modified
            html += '<td class="last-modified">';
            html += generateDateString(file[1].mtime);
            html += '</td>\n';

            // end the row
            html += '</tr>\n';
        }

        // sort and add directories
        dirs.sort().forEach(writeRow);

        // sort and add files
        files.sort().forEach(writeRow);

        html += '</table>';
        return html;
    }
};
