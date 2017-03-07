// Originally based on
// http://code.google.com/p/vimperator-labs/issues/detail?id=241

XML.ignoreWhitespace = false;
XML.prettyPrinting = false;
var INFO =
<plugin name='delicious' version='2.2'
        summary='Interface to Delicious bookmarks'
        href='https://gist.github.com/1359881'
        xmlns={NS}>
    <author>Nikolai Weibull</author>
    <author email='stepnem@gmail.com'>Štěpán Němec</author>
    <project name='Pentadactyl' minVersion='1.0'/>
    <p>
        This plugin makes it possible to add Delicious bookmarks from
        {config.appName}, with Delicious tag completion.
    <
    <item>
        <tags>:delicious</tags>
        <strut/>
        <spec>:deli[cious]</spec>
	<description>Add a Delicious bookmark.</description>
    </item>
</plugin>;

function buildURL(url, params) params.reduce(function (r, [k, v])
    v ? r + '&' + k + '=' + encodeURIComponent(v) : r,
    url + '?');

function httpPost(url, callback) {
    try {
        let req = new XMLHttpRequest();
        if (callback)
            req.onreadystatechange = function () {
                if (req.readyState == 4)
                    callback(req);
            }
        req.open('POST', url, !!callback);
        req.send(null);
        return req;
    } catch (e) {
        dactyl.log('Error opening ' + url + ': ' + e, 1);
    }
}

let usertags;
function getTags() {
    let res = [];
    let (xhr = util.httpGet('https://api.del.icio.us/v1/posts/suggest', {
        params: { url: buffer.URL }})) {
        if (xhr.status == 200) {
            let (tags = xhr.responseXML.documentElement
                .getElementsByTagName('*')) {
                Array.slice(tags).forEach(function (t)
                    res.push([t.textContent, t.localName]));
            }
        }
    }
    if (!usertags) {
        let (xhr = util.httpGet('https://api.del.icio.us/v1/tags/get')) {
            if (xhr.status == 200) {
                usertags = xhr.responseXML.documentElement
                    .getElementsByTagName('tag');
            }
        }
    }
    Array.slice(usertags).forEach(function (t)
        res.push([t.getAttribute('tag'), 'user tag']));
    return res;
}

group.commands.add(['deli[cious]'], 'Bookmark current page at Delicious',
    function (args) {
        let url = buffer.URL;
        let description = args['-description'] || buffer.title || url;
        let note = args['-note'] || String(window.content.getSelection());
        let shared = args['-private'] ? 'no' : null;

        httpPost(buildURL('https://api.del.icio.us/v1/posts/add',
            [['url', url],
             ['description', description],
             ['extended', note],
             ['tags', args.join(',')],
             ['shared', shared]]),
            function (xhr) {
                let result = xhr.status == 200 ?
                    xhr.responseXML.documentElement.getAttribute('code') :
                    'failed with status ' + xhr.status;
                dactyl.echo('Bookmarking ' + url + ' at Delicious ' + result);
            });
    }, {
        argCount: '*',
        options: [[['-description', '-d'], commands.OPTION_STRING, null,
            function () [[buffer.title]]],
            [['-note', '-n'], commands.OPTION_STRING, null, null],
            [['-private', '-p'], commands.OPTION_NOARG]],
        completer: function (context) {
            context.completions = getTags();
            context.title = ['Tag', 'Type'];
        }
    }, true);
