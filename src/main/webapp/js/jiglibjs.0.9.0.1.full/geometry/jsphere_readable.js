(function (c) {
    var d = c.Vector3DUtil;
    var b = c.JMatrix3D;
    var e = c.RigidBody;
    var a = function (g, f) {
        this.Super(g);
        this._type = "SPHERE";
        this._radius = f;
        this._boundingSphere = this._radius;
        this.set_mass(1);
        this.updateBoundingBox();
    };
    c.extend(a, c.RigidBody);
    a.prototype.name = null;
    a.prototype._radius = null;
    a.prototype.set_radius = function (f) {
        this._radius = f;
        this._boundingSphere = this._radius;
        this.setInertia(this.getInertiaProperties(this.get_mass()));
        this.setActive();
        this.updateBoundingBox();
    };
    a.prototype.get_radius = function () {
        return this._radius;
    };
    a.prototype.segmentIntersect = function (m, n, i) {
        m.fracOut = 0;
        m.posOut = [0, 0, 0, 0];
        m.normalOut = [0, 0, 0, 0];
        var j = 0;
        var g = n.delta;
        var t = d.subtract(n.origin, i.position);
        var l = this._radius * this._radius;
        var u = d.get_lengthSquared(g);
        if (u < l) {
            m.fracOut = 0;
            m.posOut = n.origin.slice(0);
            m.normalOut = d.subtract(m.posOut, i.position);
            d.normalize(m.normalOut);
            return true;
        }
        var h = d.dotProduct(t, g);
        var k = d.get_lengthSquared(t);
        var o = h * h - u * (k - l);
        if (o < 0) {
            return false;
        }
        var q = Math.sqrt(o);
        var f = (-h - q) / u;
        var p = (-h + q) / u;
        if (f > 1 || p < 0) {
            return false;
        }
        j = Math.max(f, 0);
        m.fracOut = j;
        m.posOut = n.getPoint(j);
        m.normalOut = d.subtract(m.posOut, i.position);
        d.normalize(m.normalOut);
        return true;
    };
    a.prototype.getInertiaProperties = function (f) {
        var g = 0.4 * f * this._radius * this._radius;
        return b.getScaleMatrix(g, g, g);
    };
    a.prototype.updateBoundingBox = function () {
        this._boundingBox.clear();
        this._boundingBox.addSphere(this);
    };
    c.JSphere = a;
})(jigLib);
