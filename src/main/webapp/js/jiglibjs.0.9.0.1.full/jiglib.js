jigLib={};jigLib.extend=function(a,b){for(proto in b.prototype){a.prototype[proto]=b.prototype[proto];}a.prototype.Super=b;};