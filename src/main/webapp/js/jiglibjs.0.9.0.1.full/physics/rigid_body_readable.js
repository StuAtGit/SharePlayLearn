(function (d) {
    var j = d.Vector3DUtil;
    var g = d.JConfig;
    var h = d.Matrix3D;
    var e = d.JMatrix3D;
    var a = d.JNumber3D;
    var c = d.MaterialProperties;
    var b = d.PhysicsState;
    var f = d.PhysicsSystem;
    var i = d.JAABox;
    var k = function (l) {
        this._useDegrees = (g.rotationType == "DEGREES") ? true : false;
        this._id = k.idCounter++;
        this._skin = l;
        this._material = new c();
        this._bodyInertia = new h();
        this._bodyInvInertia = e.getInverseMatrix(this._bodyInertia);
        this._currState = new b();
        this._oldState = new b();
        this._storeState = new b();
        this._invOrientation = e.getInverseMatrix(this._currState.get_orientation());
        this._currLinVelocityAux = [0, 0, 0, 0];
        this._currRotVelocityAux = [0, 0, 0, 0];
        this._force = [0, 0, 0, 0];
        this._torque = [0, 0, 0, 0];
        this._linVelDamping = [0.995, 0.995, 0.995, 0];
        this._rotVelDamping = [0.5, 0.5, 0.5, 0];
        this._maxLinVelocities = 500;
        this._maxRotVelocities = 50;
        this._velChanged = false;
        this._inactiveTime = 0;
        this._doShockProcessing = true;
        this.isActive = this._activity = true;
        this._movable = true;
        this._origMovable = true;
        this.collisions = [];
        this._constraints = [];
        this._nonCollidables = [];
        this._storedPositionForActivation = [0, 0, 0, 0];
        this._bodiesToBeActivatedOnMovement = [];
        this._lastPositionForDeactivation = this._currState.position.slice(0);
        this._lastOrientationForDeactivation = this._currState.get_orientation().clone();
        this._type = "Object3D";
        this._boundingSphere = 0;
        this._boundingBox = new i([0, 0, 0, 0], [0, 0, 0, 0]);
        this._boundingBox.clear();
    };
    k.idCounter = 0;
    k.prototype._id = null;
    k.prototype._skin = null;
    k.prototype._type = null;
    k.prototype._boundingSphere = null;
    k.prototype._boundingBox = null;
    k.prototype._currState = null;
    k.prototype._oldState = null;
    k.prototype._storeState = null;
    k.prototype._invOrientation = null;
    k.prototype._currLinVelocityAux = null;
    k.prototype._currRotVelocityAux = null;
    k.prototype._mass = null;
    k.prototype._invMass = null;
    k.prototype._bodyInertia = null;
    k.prototype._bodyInvInertia = null;
    k.prototype._worldInertia = null;
    k.prototype._worldInvInertia = null;
    k.prototype._force = null;
    k.prototype._torque = null;
    k.prototype._linVelDamping = null;
    k.prototype._rotVelDamping = null;
    k.prototype._maxLinVelocities = null;
    k.prototype._maxRotVelocities = null;
    k.prototype._velChanged = null;
    k.prototype._activity = null;
    k.prototype._movable = null;
    k.prototype._origMovable = null;
    k.prototype._inactiveTime = null;
    k.prototype._doShockProcessing = null;
    k.prototype._bodiesToBeActivatedOnMovement = null;
    k.prototype._storedPositionForActivation = null;
    k.prototype._lastPositionForDeactivation = null;
    k.prototype._lastOrientationForDeactivation = null;
    k.prototype._material = null;
    k.prototype._rotationX = 0;
    k.prototype._rotationY = 0;
    k.prototype._rotationZ = 0;
    k.prototype._useDegrees = null;
    k.prototype._nonCollidables = null;
    k.prototype._constraints = null;
    k.prototype.collisions = null;
    k.prototype.isActive = null;
    k.prototype.radiansToDegrees = function (l) {
        return l * 180 / Math.PI;
    };
    k.prototype.degreesToRadians = function (l) {
        return l * Math.PI / 180;
    };
    k.prototype.get_rotationX = function () {
        return this._rotationX;
    };
    k.prototype.get_rotationY = function () {
        return this._rotationY;
    };
    k.prototype.get_rotationZ = function () {
        return this._rotationZ;
    };
    k.prototype.set_rotationX = function (l) {
        this._rotationX = l;
        this.setOrientation(this.createRotationMatrix());
    };
    k.prototype.set_rotationY = function (l) {
        this._rotationY = l;
        this.setOrientation(this.createRotationMatrix());
    };
    k.prototype.set_rotationZ = function (l) {
        this._rotationZ = l;
        this.setOrientation(this.createRotationMatrix());
    };
    k.prototype.setRotation = function (l) {
        this._rotationX = l[0];
        this._rotationY = l[1];
        this._rotationZ = l[2];
        this.setOrientation(this.createRotationMatrix());
    };
    k.prototype.pitch = function (l) {
        this.setOrientation(e.getAppendMatrix3D(this.get_currentState().orientation, e.getRotationMatrixAxis(l, j.X_AXIS)));
    };
    k.prototype.yaw = function (l) {
        this.setOrientation(e.getAppendMatrix3D(this.get_currentState().orientation, e.getRotationMatrixAxis(l, j.Y_AXIS)));
    };
    k.prototype.roll = function (l) {
        this.setOrientation(e.getAppendMatrix3D(this.get_currentState().orientation, e.getRotationMatrixAxis(l, j.Z_AXIS)));
    };
    k.prototype.createRotationMatrix = function () {
        var l = new h();
        l.appendRotation(this._rotationX, j.X_AXIS);
        l.appendRotation(this._rotationY, j.Y_AXIS);
        l.appendRotation(this._rotationZ, j.Z_AXIS);
        return l;
    };
    k.prototype.setOrientation = function (l) {
        this._currState.set_orientation(l.clone());
        this.updateInertia();
        this.updateState();
    };
    k.prototype.get_position = function () {
        return this._currState.position;
    };
    k.prototype.get_x = function () {
        return this._currState.position[0];
    };
    k.prototype.get_y = function () {
        return this._currState.position[1];
    };
    k.prototype.get_z = function () {
        return _currState.position[2];
    };
    k.prototype.set_x = function (l) {
        this._currState.position[0] = l;
        this.updateState();
    };
    k.prototype.set_y = function (l) {
        this._currState.position[1] = l;
        this.updateState();
    };
    k.prototype.set_z = function (l) {
        this._currState.position[2] = l;
        this.updateState();
    };
    k.prototype.moveTo = function (l) {
        this._currState.position = l.slice(0);
        this.updateState();
    };
    k.prototype.updateState = function () {
        this._currState.linVelocity = [0, 0, 0, 0];
        this._currState.rotVelocity = [0, 0, 0, 0];
        this.copyCurrentStateToOld();
        this.updateBoundingBox();
    };
    k.prototype.setVelocity = function (l) {
        this._currState.linVelocity = l.slice(0);
    };
    k.prototype.setAngVel = function (l) {
        this._currState.rotVelocity = l.slice(0);
    };
    k.prototype.setVelocityAux = function (l) {
        this._currLinVelocityAux = l.slice(0);
    };
    k.prototype.setAngVelAux = function (l) {
        this._currRotVelocityAux = l.slice(0);
    };
    k.prototype.addGravity = function () {
        if (!this._movable) {
            return;
        }
        this._force = j.add(this._force, a.getScaleVector(d.PhysicsSystem.getInstance().get_gravity(), this._mass));
        this._velChanged = true;
    };
    k.prototype.addExternalForces = function (l) {
        this.addGravity();
    };
    k.prototype.addWorldTorque = function (l) {
        if (!this._movable) {
            return;
        }
        this._torque = j.add(this._torque, l);
        this._velChanged = true;
        this.setActive();
    };
    k.prototype.addBodyTorque = function (l) {
        if (!this._movable) {
            return;
        }
        e.multiplyVector(this._currState.get_orientation(), l);
        this.addWorldTorque(l);
    };
    k.prototype.addWorldForce = function (l, m) {
        if (!this._movable) {
            return;
        }
        this._force = j.add(this._force, l);
        this.addWorldTorque(j.crossProduct(j.subtract(m, this._currState.position), l));
        this._velChanged = true;
        this.setActive();
    };
    k.prototype.addBodyForce = function (l, m) {
        if (!this._movable) {
            return;
        }
        e.multiplyVector(this._currState.get_orientation(), l);
        e.multiplyVector(this._currState.get_orientation(), m);
        this.addWorldForce(l, j.add(this._currState.position, m));
    };
    k.prototype.clearForces = function () {
        this._force = [0, 0, 0, 0];
        this._torque = [0, 0, 0, 0];
    };
    k.prototype.applyWorldImpulse = function (m, n) {
        if (!this._movable) {
            return;
        }
        this._currState.linVelocity = j.add(this._currState.linVelocity, a.getScaleVector(m, this._invMass));
        var l = j.crossProduct(j.subtract(n, this._currState.position), m);
        e.multiplyVector(this._worldInvInertia, l);
        this._currState.rotVelocity = j.add(this._currState.rotVelocity, l);
        this._velChanged = true;
    };
    k.prototype.applyWorldImpulseAux = function (m, n) {
        if (!this._movable) {
            return;
        }
        this._currLinVelocityAux = j.add(this._currLinVelocityAux, a.getScaleVector(m, this._invMass));
        var l = j.crossProduct(j.subtract(n, this._currState.position), m);
        e.multiplyVector(this._worldInvInertia, l);
        this._currRotVelocityAux = j.add(this._currRotVelocityAux, l);
        this._velChanged = true;
    };
    k.prototype.applyBodyWorldImpulse = function (m, n) {
        if (!this._movable) {
            return;
        }
        this._currState.linVelocity = j.add(this._currState.linVelocity, a.getScaleVector(m, this._invMass));
        var l = j.crossProduct(n, m);
        e.multiplyVector(this._worldInvInertia, l);
        this._currState.rotVelocity = j.add(this._currState.rotVelocity, l);
        this._velChanged = true;
    };
    k.prototype.applyBodyWorldImpulseAux = function (m, n) {
        if (!this._movable) {
            return;
        }
        this._currLinVelocityAux = j.add(this._currLinVelocityAux, a.getScaleVector(m, this._invMass));
        var l = j.crossProduct(n, m);
        e.multiplyVector(this._worldInvInertia, l);
        this._currRotVelocityAux = j.add(this._currRotVelocityAux, l);
        this._velChanged = true;
    };
    k.prototype.addConstraint = function (l) {
        if (!this.findConstraint(l)) {
            this._constraints.push(l);
        }
    };
    k.prototype.removeConstraint = function (l) {
        if (this.findConstraint(l)) {
            this._constraints.splice(this._constraints.indexOf(l), 1);
        }
    };
    k.prototype.removeAllConstraints = function () {
        this._constraints = [];
    };
    k.prototype.findConstraint = function (n) {
        for (var m = 0, l = this._constraints.length; m < l; m++) {
            if (n == this._constraints[m]) {
                return true;
            }
        }
        return false;
    };
    k.prototype.updateVelocity = function (m) {
        if (!this._movable || !this._activity) {
            return;
        }
        this._currState.linVelocity = j.add(this._currState.linVelocity, a.getScaleVector(this._force, this._invMass * m));
        var l = a.getScaleVector(this._torque, m);
        e.multiplyVector(this._worldInvInertia, l);
        this._currState.rotVelocity = j.add(this._currState.rotVelocity, l);
    };
    k.prototype.updatePositionWithAux = function (q) {
        if (!this._movable || !this._activity) {
            this._currLinVelocityAux = [0, 0, 0, 0];
            this._currRotVelocityAux = [0, 0, 0, 0];
            return;
        }
        var r = d.PhysicsSystem.getInstance().get_gravityAxis();
        if (r != -1) {
            var l = this._currLinVelocityAux.slice(0);
            l[(r + 1) % 3] *= 0.1;
            l[(r + 2) % 3] *= 0.1;
            a.copyFromArray(this._currLinVelocityAux, l);
        }
        var n = this._currState.rotVelocity.slice(0);
        e.multiplyVector(this._worldInertia, n);
        this._currState.position = j.add(this._currState.position, a.getScaleVector(j.add(this._currState.linVelocity, this._currLinVelocityAux), q));
        var p = j.add(this._currState.rotVelocity, this._currRotVelocityAux);
        var o = j.get_length(p) * 180 / Math.PI;
        if (o > 0) {
            j.normalize(p);
            o *= q;
            var m = e.getRotationMatrix(p[0], p[1], p[2], o);
            this._currState.set_orientation(e.getAppendMatrix3D(this._currState.get_orientation(), m));
            this.updateInertia();
        }
        this._currLinVelocityAux = [0, 0, 0, 0];
        this._currRotVelocityAux = [0, 0, 0, 0];
        e.multiplyVector(this._worldInvInertia, n);
        this._currState.rotVelocity = n.slice(0);
        this.updateBoundingBox();
    };
    k.prototype.postPhysics = function (l) {};
    k.prototype.tryToFreeze = function (m) {
        if (!this._movable || !this._activity) {
            return;
        }
        if (j.get_length(j.subtract(this._currState.position, this._lastPositionForDeactivation)) > g.posThreshold) {
            this._lastPositionForDeactivation = this._currState.position.slice(0);
            this._inactiveTime = 0;
            return;
        }
        var l = g.orientThreshold;
        var o = e.getSubMatrix(this._currState.get_orientation(), this._lastOrientationForDeactivation);
        var n = e.getCols(o);
        if (j.get_length(n[0]) > l || j.get_length(n[1]) > l || j.get_length(n[2]) > l) {
            this._lastOrientationForDeactivation = this._currState.get_orientation().clone();
            this._inactiveTime = 0;
            return;
        }
        if (this.getShouldBeActive()) {
            return;
        }
        this._inactiveTime += m;
        if (this._inactiveTime > g.deactivationTime) {
            this._lastPositionForDeactivation = this._currState.position.slice(0);
            this._lastOrientationForDeactivation = this._currState.get_orientation().clone();
            this.setInactive();
        }
    };
    k.prototype.set_mass = function (l) {
        this._mass = l;
        this._invMass = 1 / l;
        this.setInertia(this.getInertiaProperties(l));
    };
    k.prototype.setInertia = function (l) {
        this._bodyInertia = l.clone();
        this._bodyInvInertia = e.getInverseMatrix(this._bodyInertia.clone());
        this.updateInertia();
    };
    k.prototype.updateInertia = function () {
        this._invOrientation = e.getTransposeMatrix(this._currState.get_orientation());
        this._worldInertia = e.getAppendMatrix3D(this._invOrientation, e.getAppendMatrix3D(this._currState.get_orientation(), this._bodyInertia));
        this._worldInvInertia = e.getAppendMatrix3D(this._invOrientation, e.getAppendMatrix3D(this._currState.get_orientation(), this._bodyInvInertia));
    };
    k.prototype.get_movable = function () {
        return this._movable;
    };
    k.prototype.set_movable = function (l) {
        if (this._type == "PLANE" || this._type == "TERRAIN") {
            return;
        }
        this._movable = l;
        this.isActive = this._activity = l;
        this._origMovable = l;
    };
    k.prototype.internalSetImmovable = function () {
        if (this._type == "PLANE" || this._type == "TERRAIN") {
            return;
        }
        this._origMovable = this._movable;
        this._movable = false;
    };
    k.prototype.internalRestoreImmovable = function () {
        if (this._type == "PLANE" || this._type == "TERRAIN") {
            return;
        }
        this._movable = this._origMovable;
    };
    k.prototype.getVelChanged = function () {
        return this._velChanged;
    };
    k.prototype.clearVelChanged = function () {
        this._velChanged = false;
    };
    k.prototype.setActive = function (l) {
        if (!l) {
            l = 1;
        }
        if (this._movable) {
            this.isActive = this._activity = true;
            this._inactiveTime = (1 - l) * g.deactivationTime;
        }
    };
    k.prototype.setInactive = function () {
        if (this._movable) {
            this.isActive = this._activity = false;
        }
    };
    k.prototype.getVelocity = function (l) {
        return j.add(this._currState.linVelocity, j.crossProduct(this._currState.rotVelocity, l));
    };
    k.prototype.getVelocityAux = function (l) {
        return j.add(this._currLinVelocityAux, j.crossProduct(this._currRotVelocityAux, l));
    };
    k.prototype.getShouldBeActive = function () {
        return ((j.get_length(this._currState.linVelocity) > g.velThreshold) || (j.get_length(this._currState.rotVelocity) > g.angVelThreshold));
    };
    k.prototype.getShouldBeActiveAux = function () {
        return ((j.get_length(this._currLinVelocityAux) > g.velThreshold) || (j.get_length(this._currRotVelocityAux) > g.angVelThreshold));
    };
    k.prototype.dampForDeactivation = function () {
        this._currState.linVelocity[0] *= this._linVelDamping[0];
        this._currState.linVelocity[1] *= this._linVelDamping[1];
        this._currState.linVelocity[2] *= this._linVelDamping[2];
        this._currState.rotVelocity[0] *= this._rotVelDamping[0];
        this._currState.rotVelocity[1] *= this._rotVelDamping[1];
        this._currState.rotVelocity[2] *= this._rotVelDamping[2];
        this._currLinVelocityAux[0] *= this._linVelDamping[0];
        this._currLinVelocityAux[1] *= this._linVelDamping[1];
        this._currLinVelocityAux[2] *= this._linVelDamping[2];
        this._currRotVelocityAux[0] *= this._rotVelDamping[0];
        this._currRotVelocityAux[1] *= this._rotVelDamping[1];
        this._currRotVelocityAux[2] *= this._rotVelDamping[2];
        var m = 0.5;
        var l = this._inactiveTime / g.deactivationTime;
        if (l < m) {
            return;
        }
        var n = 1 - ((l - m) / (1 - m));
        if (n < 0) {
            n = 0;
        } else {
            if (n > 1) {
                n = 1;
            }
        }
        this._currState.linVelocity = a.getScaleVector(this._currState.linVelocity, n);
        this._currState.rotVelocity = a.getScaleVector(this._currState.rotVelocity, n);
    };
    k.prototype.doMovementActivations = function () {
        var l = this._bodiesToBeActivatedOnMovement.length;
        if (l == 0 || j.get_length(j.subtract(this._currState.position, this._storedPositionForActivation)) < g.posThreshold) {
            return;
        }
        for (var m = 0; m < l; m++) {
            d.PhysicsSystem.getInstance().activateObject(this._bodiesToBeActivatedOnMovement[m]);
        }
        this._bodiesToBeActivatedOnMovement = [];
    };
    k.prototype.addMovementActivation = function (o, n) {
        var l = this._bodiesToBeActivatedOnMovement.length;
        for (var m = 0; m < l; m++) {
            if (this._bodiesToBeActivatedOnMovement[m] == n) {
                return;
            }
        }
        if (this._bodiesToBeActivatedOnMovement.length == 0) {
            this._storedPositionForActivation = o;
        }
        this._bodiesToBeActivatedOnMovement.push(n);
    };
    k.prototype.setConstraintsAndCollisionsUnsatisfied = function () {
        for (var m = 0, l = this._constraints.length; m < l; m++) {
            this._constraints[m].set_satisfied(false);
        }
        for (var m = 0, n = this.collisions.length; m < n; m++) {
            this.collisions[m].satisfied = false;
        }
    };
    k.prototype.segmentIntersect = function (m, l, n) {
        return false;
    };
    k.prototype.getInertiaProperties = function (l) {
        return new h();
    };
    k.prototype.updateBoundingBox = function () {};
    k.prototype.hitTestObject3D = function (l) {
        var n = j.get_length(j.subtract(this._currState.position, l.get_currentState().position));
        var m = this._boundingSphere + l.get_boundingSphere();
        if (n <= m) {
            return true;
        }
        return false;
    };
    k.prototype.findNonCollidablesBody = function (l) {
        for (var n = 0, m = this._nonCollidables.length; n < m; n++) {
            if (l == this._nonCollidables[n]) {
                return true;
            }
        }
        return false;
    };
    k.prototype.disableCollisions = function (l) {
        if (!this.findNonCollidablesBody(l)) {
            this._nonCollidables.push(l);
        }
    };
    k.prototype.enableCollisions = function (l) {
        if (this.findNonCollidablesBody(l)) {
            this._nonCollidables.splice(this._nonCollidables.indexOf(l), 1);
        }
    };
    k.prototype.copyCurrentStateToOld = function () {
        this._oldState.position = this._currState.position.slice(0);
        this._oldState.set_orientation(this._currState.get_orientation().clone());
        this._oldState.linVelocity = this._currState.linVelocity.slice(0);
        this._oldState.rotVelocity = this._currState.rotVelocity.slice(0);
    };
    k.prototype.storeState = function () {
        this._storeState.position = this._currState.position.slice(0);
        this._storeState.set_orientation(this._currState.get_orientation().clone());
        this._storeState.linVelocity = this._currState.linVelocity.slice(0);
        this._storeState.rotVelocity = this._currState.rotVelocity.slice(0);
    };
    k.prototype.restoreState = function () {
        this._currState.position = this._storeState.position.slice(0);
        this._currState.set_orientation(this._storeState.get_orientation().clone());
        this._currState.linVelocity = this._storeState.linVelocity.slice(0);
        this._currState.rotVelocity = this._storeState.rotVelocity.slice(0);
    };
    k.prototype.get_currentState = function () {
        return this._currState;
    };
    k.prototype.get_oldState = function () {
        return this._oldState;
    };
    k.prototype.get_id = function () {
        return this._id;
    };
    k.prototype.get_type = function () {
        return this._type;
    };
    k.prototype.get_skin = function () {
        return this._skin;
    };
    k.prototype.get_boundingSphere = function () {
        return this._boundingSphere;
    };
    k.prototype.get_boundingBox = function () {
        return this._boundingBox;
    };
    k.prototype.get_force = function () {
        return this._force;
    };
    k.prototype.get_mass = function () {
        return this._mass;
    };
    k.prototype.get_invMass = function () {
        return this._invMass;
    };
    k.prototype.get_worldInertia = function () {
        return this._worldInertia;
    };
    k.prototype.get_worldInvInertia = function () {
        return this._worldInvInertia;
    };
    k.prototype.get_nonCollidables = function () {
        return this._nonCollidables;
    };
    k.prototype.get_doShockProcessing = function () {
        return this._doShockProcessing;
    };
    k.prototype.set_doShockProcessing = function (l) {
        this._doShockProcessing = l;
    };
    k.prototype.set_linVelocityDamping = function (l) {
        this._linVelDamping[0] = a.getLimiteNumber(l[0], 0, 1);
        this._linVelDamping[1] = a.getLimiteNumber(l[1], 0, 1);
        this._linVelDamping[2] = a.getLimiteNumber(l[2], 0, 1);
    };
    k.prototype.get_linVelocityDamping = function () {
        return this._linVelDamping;
    };
    k.prototype.set_rotVelocityDamping = function (l) {
        this._rotVelDamping[0] = a.getLimiteNumber(l[0], 0, 1);
        this._rotVelDamping[1] = a.getLimiteNumber(l[1], 0, 1);
        this._rotVelDamping[2] = a.getLimiteNumber(l[2], 0, 1);
    };
    k.prototype.get_rotVelocityDamping = function () {
        return this._rotVelDamping;
    };
    k.prototype.set_maxLinVelocities = function (l) {
        this._maxLinVelocities = a.getLimiteNumber(Math.abs(l), 0, 500);
    };
    k.prototype.get_maxLinVelocities = function () {
        return this._maxLinVelocities;
    };
    k.prototype.set_maxRotVelocities = function (l) {
        this._maxRotVelocities = a.getLimiteNumber(Math.abs(l), a.NUM_TINY, 50);
    };
    k.prototype.get_maxRotVelocities = function () {
        return this._maxRotVelocities;
    };
    k.prototype.limitVel = function () {
        this._currState.linVelocity[0] = a.getLimiteNumber(this._currState.linVelocity[0], -this._maxLinVelocities, this._maxLinVelocities);
        this._currState.linVelocity[1] = a.getLimiteNumber(this._currState.linVelocity[1], -this._maxLinVelocities, this._maxLinVelocities);
        this._currState.linVelocity[2] = a.getLimiteNumber(this._currState.linVelocity[2], -this._maxLinVelocities, this._maxLinVelocities);
    };
    k.prototype.limitAngVel = function () {
        var n = Math.abs(this._currState.rotVelocity[0]) / this._maxRotVelocities;
        var m = Math.abs(this._currState.rotVelocity[1]) / this._maxRotVelocities;
        var l = Math.abs(this._currState.rotVelocity[2]) / this._maxRotVelocities;
        var o = Math.max(n, m, l);
        if (o > 1) {
            this._currState.rotVelocity = a.getDivideVector(this._currState.rotVelocity, o);
        }
    };
    k.prototype.getTransform = function () {
        if (this._skin != null) {
            return this._skin.get_transform();
        } else {
            return null;
        }
    };
    k.prototype.updateObject3D = function () {
        if (this._skin != null) {
            this._skin.set_transform(e.getAppendMatrix3D(this._currState.get_orientation(), e.getTranslationMatrix(this._currState.position[0], this._currState.position[1], this._currState.position[2])));
        }
    };
    k.prototype.get_material = function () {
        return this._material;
    };
    k.prototype.get_restitution = function () {
        return this._material.get_restitution();
    };
    k.prototype.set_restitution = function (l) {
        this._material.set_restitution(a.getLimiteNumber(l, 0, 1));
    };
    k.prototype.get_friction = function () {
        return this._material.get_friction();
    };
    k.prototype.set_friction = function (l) {
        this._material.set_friction(a.getLimiteNumber(l, 0, 1));
    };
    d.RigidBody = k;
})(jigLib);
