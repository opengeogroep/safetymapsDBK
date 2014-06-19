/**
 *  Copyright (c) 2014 B3Partners B.V. (info@b3partners.nl)
 * 
 *  This file is part of safetymapDBK
 *  
 *  safetymapDBK is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  safetymapDBK is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with safetymapDBK. If not, see <http://www.gnu.org/licenses/>.
 *
 */ 

var fs = require('fs');
var xml = require('xml');

/**
 * Exports symbols data to XML.
 */

global.conf = require('nconf');

// First consider commandline arguments and environment variables, respectively.
global.conf.argv().env();

// Then load configuration from a designated file.
global.conf.file({ file: 'config.json' });

var dbURL = 'postgres://' + 
        global.conf.get('database:user') + ':' + 
        global.conf.get('database:password') + '@' + 
        global.conf.get('database:host') + ':' + 
        global.conf.get('database:port') + '/' + 
        global.conf.get('database:dbname');

var dbk = require('./controllers/dbk.js');
var anyDB = require('any-db');
global.pool = anyDB.createPool(dbURL, {min: 2, max: 20});

var query_str = 'select brandweervoorziening_symbool as type, naam, namespace, categorie, omschrijving from dbk.type_brandweervoorziening order by namespace,  brandweervoorziening_symbool';
global.pool.query(query_str,
    function(err, result){
        if(err) {
            console.log(err);
        } else {
            var s = "<?xml-stylesheet type='text/xsl' href='symbols.xsl'?>\n";
            var xo = { symbols: []};
            for(var i in result.rows) {
                var r = result.rows[i];
                var ro = { symbol: []};
                for(var k in r) {
                    if(r[k]) {
                        var o = {};
                        o[k] = r[k];
                        ro.symbol.push(o);
                    }
                }
                xo.symbols.push(ro);
            }
            s += xml(xo, true);
            s += "\n";
            fs.writeFileSync('symbols.xml', s);
        }
		process.exit(0);            
    }
);
