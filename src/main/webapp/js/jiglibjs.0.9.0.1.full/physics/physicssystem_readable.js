(function(d)
{
    var k=d.Vector3DUtil;
    var h=d.JConfig;
    var j=d.CollPointInfo;
    var i=d.CollisionSystem;
    var g=d.ContactData;
    var e=d.JMatrix3D;
    var b=d.JNumber3D;
    var c=d.BodyPair;
    var a=d.CachedImpulse;
    var f=function()
    {
        this.setSolverType(h.solverType);
        this._doingIntegration=false;
        this._bodies=[];
        this._collisions=[];
        this._effects=[];
        this._activeBodies=[];
        this._constraints=[];
        this._controllers=[];
        this._cachedContacts=[];
        this._collisionSystem=new i();
        this.setGravity(b.getScaleVector(k.Y_AXIS,-10));
    };
    f.prototype._currentPhysicsSystem=null;
    f.prototype._maxVelMag=0.5;
    f.prototype._minVelForProcessing=0.001;
    f.prototype._bodies=null;
    f.prototype._activeBodies=null;
    f.prototype._collisions=null;
    f.prototype._constraints=null;
    f.prototype._controllers=null;
    f.prototype._effects=null;
    f.prototype._gravityAxis=null;
    f.prototype._gravity=null;
    f.prototype._doingIntegration=null;
    f.prototype.preProcessCollisionFn=function() {};
    f.prototype.preProcessContactFn=function() {};
    f.prototype.processCollisionFn=function() {};
    f.prototype.processContactFn=function() {};
    f.prototype._cachedContacts=null;
    f.prototype._collisionSystem=null;
    f.getInstance=function()
    {
        if(!f._currentPhysicsSystem)
        {
            f._currentPhysicsSystem=new f();
        }
        return f._currentPhysicsSystem;
    };
    f.prototype.getAllExternalForces=function(n)
    {
        for(var m=0,o=this._bodies.length; m<o; m++)
        {
            this._bodies[m].addExternalForces(n);
        }
        for(var m=0,l=this._controllers.length; m<l; m++)
        {
            this._controllers[m].updateController(n);
        }
    };
    f.prototype.getCollisionSystem=function()
    {
        return this._collisionSystem;
    };
    f.prototype.setGravity=function(l)
    {
        this._gravity=l;
        if(this._gravity[0]==this._gravity[1]&&this._gravity[1]==this._gravity[2])
        {
            this._gravityAxis=-1;
        }
        this._gravityAxis=0;
        if(Math.abs(this._gravity[1])>Math.abs(this._gravity[2]))
        {
            this._gravityAxis=1;
        }
        if(Math.abs(this._gravity[2])>Math.abs(this._gravity[this._gravityAxis]))
        {
            this._gravityAxis=2;
        }
    };
    f.prototype.get_gravity=function()
    {
        return this._gravity;
    };
    f.prototype.get_gravityAxis=function()
    {
        return this._gravityAxis;
    };
    f.prototype.get_bodies=function()
    {
        return this._bodies;
    };
    f.prototype.addBody=function(l)
    {
        if(!this.findBody(l))
        {
            this._bodies.push(l);
            this._collisionSystem.addCollisionBody(l);
        }
    };
    f.prototype.removeBody=function(l)
    {
        if(this.findBody(l))
        {
            this._bodies.splice(this._bodies.indexOf(l),1);
            this._collisionSystem.removeCollisionBody(l);
        }
    };
    f.prototype.removeAllBodies=function()
    {
        this._bodies=[];
        this._collisionSystem.removeAllCollisionBodies();
    };
    f.prototype.addConstraint=function(l)
    {
        if(!this.findConstraint(l))
        {
            this._constraints.push(l);
        }
    };
    f.prototype.removeConstraint=function(l)
    {
        if(this.findConstraint(l))
        {
            this._constraints.splice(this._constraints.indexOf(l),1);
        }
    };
    f.prototype.removeAllConstraints=function()
    {
        this._constraints=[];
    };
    f.prototype.addEffect=function(l)
    {
        if(!this.findEffect(l))
        {
            this._effects.push(l);
        }
    };
    f.prototype.removeEffect=function(l)
    {
        if(this.findEffect(l))
        {
            this._effects.splice(this._effects.indexOf(l),1);
        }
    };
    f.prototype.removeAllEffects=function()
    {
        this._effects=[];
    };
    f.prototype.addController=function(l)
    {
        if(!this.findController(l))
        {
            this._controllers.push(l);
        }
    };
    f.prototype.removeController=function(l)
    {
        if(this.findController(l))
        {
            this._controllers.splice(this._controllers.indexOf(l),1);
        }
    };
    f.prototype.removeAllControllers=function()
    {
        this._controllers=[];
    };
    f.prototype.setSolverType=function(l)
    {
        switch(l)
        {
        case"FAST":
            this.preProcessCollisionFn=this.preProcessCollisionFast;
            this.preProcessContactFn=this.preProcessCollisionFast;
            this.processCollisionFn=this.processCollision;
            this.processContactFn=this.processCollision;
            return;
        case"NORMAL":
            this.preProcessCollisionFn=this.preProcessCollisionNormal;
            this.preProcessContactFn=this.preProcessCollisionNormal;
            this.processCollisionFn=this.processCollision;
            this.processContactFn=this.processCollision;
            return;
        case"ACCUMULATED":
            this.preProcessCollisionFn=this.preProcessCollisionAccumulated;
            this.preProcessContactFn=this.preProcessCollisionAccumulated;
            this.processCollisionFn=this.processCollision;
            this.processContactFn=this.processCollisionAccumulated;
            return;
        default:
            this.preProcessCollisionFn=this.preProcessCollisionNormal;
            this.preProcessContactFn=this.preProcessCollisionNormal;
            this.processCollisionFn=this.processCollision;
            this.processContactFn=this.processCollision;
            return;
        }
    };
    f.prototype.findBody=function(l)
    {
        var m=this._bodies.length-1;
        if(m>0)
        {
            do
            {
                if(l==this._bodies[m])
                {
                    return true;
                }
            }
            while(m--);
        }
        return false;
    };
    f.prototype.findConstraint=function(m)
    {
        var l=this._constraints.length-1;
        if(l>0)
        {
            do
            {
                if(m==this._constraints[l])
                {
                    return true;
                }
            }
            while(l--);
        }
        return false;
    };
    f.prototype.findEffect=function(m)
    {
        var l=this._effects.length-1;
        if(l>0)
        {
            do
            {
                if(m==this._effects[l])
                {
                    return true;
                }
            }
            while(l--);
        }
        return false;
    };
    f.prototype.findController=function(l)
    {
        var m=this._controllers.length-1;
        if(m>0)
        {
            do
            {
                if(l==this._controllers[m])
                {
                    return true;
                }
            }
            while(m--);
        }
        return false;
    };
    f.prototype.preProcessCollisionFast=function(x,n)
    {
        x.satisfied=false;
        var m=x.objInfo.body0;
        var l=x.objInfo.body1;
        var s=x.dirToBody;
        var z=h.numPenetrationRelaxationTimesteps*n;
        var w=0;
        var y;
        var q;
        var p=x.pointInfo.length;
        var r=b.NUM_TINY;
        if(p>1)
        {
            var v=[0,0,0,0];
            var t=[0,0,0,0];
            var B=0;
            for(var o=0; o<p; o++)
            {
                y=x.pointInfo[o];
                v=k.add(v,y.r0);
                t=k.add(t,y.r1);
                B+=y.initialPenetration;
            }
            v=b.getDivideVector(v,p);
            t=b.getDivideVector(t,p);
            B/=p;
            var A=new j();
            A.r0=v;
            A.r1=t;
            A.initialPenetration=B;
            x.pointInfo=[A];
        }
        y=x.pointInfo[0];
        if(!m.get_movable())
        {
            y.denominator=0;
        }
        else
        {
            q=k.crossProduct(y.r0,s);
            e.multiplyVector(m.get_worldInvInertia(),q);
            y.denominator=m.get_invMass()+k.dotProduct(s,k.crossProduct(q,y.r0));
        }
        if(l.get_movable())
        {
            q=k.crossProduct(y.r1,s);
            e.multiplyVector(l.get_worldInvInertia(),q);
            y.denominator+=(l.get_invMass()+k.dotProduct(s,k.crossProduct(q,y.r1)));
        }
        if(y.denominator<r)
        {
            y.denominator=r;
        }
        if(y.initialPenetration>h.allowedPenetration)
        {
            y.minSeparationVel=(y.initialPenetration-h.allowedPenetration)/z;
        }
        else
        {
            w=-0.1*(y.initialPenetration-h.allowedPenetration)/h.allowedPenetration;
            if(w<r)
            {
                w=r;
            }
            else
            {
                if(w>1)
                {
                    w=1;
                }
            }
            var u=(n>r)?n:r;
            y.minSeparationVel=w*(y.initialPenetration-h.allowedPenetration)/u;
        }
        if(y.minSeparationVel>this._maxVelMag)
        {
            y.minSeparationVel=this._maxVelMag;
        }
    };
    f.prototype.preProcessCollisionNormal=function(u,n)
    {
        u.satisfied=false;
        var m=u.objInfo.body0;
        var l=u.objInfo.body1;
        var r=u.dirToBody;
        var w=h.numPenetrationRelaxationTimesteps*n;
        var t=0;
        var v;
        var q;
        var p=u.pointInfo.length;
        for(var o=0; o<p; o++)
        {
            v=u.pointInfo[o];
            if(!m.get_movable())
            {
                v.denominator=0;
            }
            else
            {
                q=k.crossProduct(v.r0,r);
                e.multiplyVector(m.get_worldInvInertia(),q);
                v.denominator=m.get_invMass()+k.dotProduct(r,k.crossProduct(q,v.r0));
            }
            if(l.get_movable())
            {
                q=k.crossProduct(v.r1,r);
                e.multiplyVector(l.get_worldInvInertia(),q);
                v.denominator+=(l.get_invMass()+k.dotProduct(r,k.crossProduct(q,v.r1)));
            }
            if(v.denominator<b.NUM_TINY)
            {
                v.denominator=b.NUM_TINY;
            }
            if(v.initialPenetration>h.allowedPenetration)
            {
                v.minSeparationVel=(v.initialPenetration-h.allowedPenetration)/w;
            }
            else
            {
                t=-0.1*(v.initialPenetration-h.allowedPenetration)/h.allowedPenetration;
                if(t<b.NUM_TINY)
                {
                    t=b.NUM_TINY;
                }
                else
                {
                    if(t>1)
                    {
                        t=1;
                    }
                }
                var s=(n>b.NUM_TINY)?n:b.NUM_TINY;
                v.minSeparationVel=t*(v.initialPenetration-h.allowedPenetration)/s;
            }
            if(v.minSeparationVel>this._maxVelMag)
            {
                v.minSeparationVel=this._maxVelMag;
            }
        }
    };
    f.prototype.preProcessCollisionAccumulated=function(q,y)
    {
        q.satisfied=false;
        var x=q.objInfo.body0;
        var v=q.objInfo.body1;
        var r=q.dirToBody;
        var w=h.numPenetrationRelaxationTimesteps*y;
        var p;
        var t;
        var H;
        var E=0;
        var F=b.NUM_TINY;
        var u=h.allowedPenetration;
        var D=q.pointInfo.length;
        for(var C=0; C<D; C++)
        {
            t=q.pointInfo[C];
            H=t.initialPenetration-u;
            if(!x.get_movable())
            {
                t.denominator=0;
            }
            else
            {
                p=k.crossProduct(t.r0,r);
                e.multiplyVector(x.get_worldInvInertia(),p);
                t.denominator=x.get_invMass()+k.dotProduct(r,k.crossProduct(p,t.r0));
            }
            if(v.get_movable())
            {
                p=k.crossProduct(t.r1,r);
                e.multiplyVector(v.get_worldInvInertia(),p);
                t.denominator+=(v.get_invMass()+k.dotProduct(r,k.crossProduct(p,t.r1)));
            }
            if(t.denominator<F)
            {
                t.denominator=F;
            }
            if(t.initialPenetration>u)
            {
                t.minSeparationVel=H/w;
            }
            else
            {
                E=-0.1*H/u;
                if(E<F)
                {
                    E=F;
                }
                else
                {
                    if(E>1)
                    {
                        E=1;
                    }
                }
                var B=(y>F)?y:F;
                t.minSeparationVel=E*H/B;
            }
            t.accumulatedNormalImpulse=0;
            t.accumulatedNormalImpulseAux=0;
            t.accumulatedFrictionImpulse=[0,0,0,0];
            var o=0.04;
            var G=new c(x,v,[0,0,0,0],[0,0,0,0]);
            for(var A=0,n=this._cachedContacts.length; A<n; A++)
            {
                var l=this._cachedContacts[A];
                var z=l.pair;
                if(G.body0!=z.body0||G.body1==z.body1)
                {
                    continue;
                }
                var m=(z.body0==x)?k.get_lengthSquared(k.subtract(z.r,t.r0)):k.get_lengthSquared(k.subtract(z.r,t.r1));
                if(m<o)
                {
                    o=m;
                    t.accumulatedNormalImpulse=this._cachedContacts[A].impulse.normalImpulse;
                    t.accumulatedNormalImpulseAux=this._cachedContacts[A].impulse.normalImpulseAux;
                    t.accumulatedFrictionImpulse=this._cachedContacts[A].impulse.frictionImpulse;
                    if(this._cachedContacts[A].pair.body0!=x)
                    {
                        t.accumulatedFrictionImpulse=b.getScaleVector(t.accumulatedFrictionImpulse,-1);
                    }
                }
            }
            var s;
            if(t.accumulatedNormalImpulse!=0)
            {
                s=b.getScaleVector(r,t.accumulatedNormalImpulse);
                s=k.add(s,t.accumulatedFrictionImpulse);
                x.applyBodyWorldImpulse(s,t.r0);
                v.applyBodyWorldImpulse(b.getScaleVector(s,-1),t.r1);
            }
            if(t.accumulatedNormalImpulseAux!=0)
            {
                s=b.getScaleVector(r,t.accumulatedNormalImpulseAux);
                x.applyBodyWorldImpulseAux(s,t.r0);
                v.applyBodyWorldImpulseAux(b.getScaleVector(s,-1),t.r1);
            }
        }
    };
    f.prototype.processCollision=function(r,D)
    {
        r.satisfied=true;
        var A=r.objInfo.body0;
        var z=r.objInfo.body1;
        var v=false;
        var t=r.dirToBody;
        var G=0;
        var H=0;
        var n=0;
        var C=0;
        var x;
        var u;
        var s;
        var y;
        var F=r.pointInfo.length;
        for(var E=0; E<F; E++)
        {
            y=r.pointInfo[E];
            u=A.getVelocity(y.r0);
            s=z.getVelocity(y.r1);
            H=k.dotProduct(k.subtract(u,s),t);
            if(H>y.minSeparationVel)
            {
                continue;
            }
            n=-1*r.mat.get_restitution()*H;
            if(n<this._minVelForProcessing)
            {
                n=y.minSeparationVel;
            }
            G=n-H;
            if(G<=this._minVelForProcessing)
            {
                continue;
            }
            C=G/y.denominator;
            v=true;
            x=b.getScaleVector(t,C);
            A.applyBodyWorldImpulse(x,y.r0);
            z.applyBodyWorldImpulse(b.getScaleVector(x,-1),y.r1);
            var p;
            var B=u.slice(0);
            if(z.get_movable())
            {
                B=k.subtract(u,s);
            }
            var q=k.subtract(B,b.getScaleVector(t,k.dotProduct(B,t)));
            var w=k.get_length(q);
            if(w>this._minVelForProcessing)
            {
                var o=b.getDivideVector(q,-w);
                var l=0;
                if(A.get_movable())
                {
                    p=k.crossProduct(y.r0,o);
                    e.multiplyVector(A.get_worldInvInertia(),p);
                    l=A.get_invMass()+k.dotProduct(o,k.crossProduct(p,y.r0));
                }
                if(z.get_movable())
                {
                    p=k.crossProduct(y.r1,o);
                    e.multiplyVector(z.get_worldInvInertia(),p);
                    l+=(z.get_invMass()+k.dotProduct(o,k.crossProduct(p,y.r1)));
                }
                if(l>b.NUM_TINY)
                {
                    var m=w/l;
                    o=b.getScaleVector(o,m);
                    A.applyBodyWorldImpulse(o,y.r0);
                    z.applyBodyWorldImpulse(b.getScaleVector(o,-1),y.r1);
                }
            }
        }
        if(v)
        {
            A.setConstraintsAndCollisionsUnsatisfied();
            z.setConstraintsAndCollisionsUnsatisfied();
        }
        return v;
    };
    f.prototype.processCollisionAccumulated=function(r,I)
    {
        r.satisfied=true;
        var w=false;
        var u=r.dirToBody;
        var F=r.objInfo.body0;
        var E=r.objInfo.body1;
        var O=0;
        var Q=0;
        var H=0;
        var z;
        var v;
        var t;
        var A;
        var M=r.pointInfo.length;
        for(var K=0; K<M; K++)
        {
            A=r.pointInfo[K];
            v=F.getVelocity(A.r0);
            t=E.getVelocity(A.r1);
            Q=k.dotProduct(k.subtract(v,t),u);
            O=-Q;
            if(A.minSeparationVel<0)
            {
                O+=A.minSeparationVel;
            }
            if(Math.abs(O)>this._minVelForProcessing)
            {
                H=O/A.denominator;
                var C=A.accumulatedNormalImpulse;
                var J=(C+H);
                if(J<0)
                {
                    J=0;
                }
                A.accumulatedNormalImpulse=J;
                var s=J-C;
                z=b.getScaleVector(u,s);
                F.applyBodyWorldImpulse(z,A.r0);
                E.applyBodyWorldImpulse(b.getScaleVector(z,-1),A.r1);
                w=true;
            }
            v=F.getVelocityAux(A.r0);
            t=E.getVelocityAux(A.r1);
            Q=k.dotProduct(k.subtract(v,t),u);
            O=-Q;
            if(A.minSeparationVel>0)
            {
                O+=A.minSeparationVel;
            }
            if(Math.abs(O)>this._minVelForProcessing)
            {
                H=O/A.denominator;
                C=A.accumulatedNormalImpulseAux;
                var D=A.accumulatedNormalImpulseAux+H;
                if(D<0)
                {
                    D=0;
                }
                A.accumulatedNormalImpulseAux=D;
                s=D-C;
                z=b.getScaleVector(u,s);
                F.applyBodyWorldImpulseAux(z,A.r0);
                E.applyBodyWorldImpulseAux(b.getScaleVector(z,-1),A.r1);
                w=true;
            }
            if(A.accumulatedNormalImpulse>0)
            {
                v=F.getVelocity(A.r0);
                t=E.getVelocity(A.r1);
                var p;
                var G=k.subtract(v,t);
                var q=k.subtract(G,b.getScaleVector(u,k.dotProduct(G,u)));
                var y=k.get_length(q);
                if(y>this._minVelForProcessing)
                {
                    var o=b.getScaleVector(b.getDivideVector(q,y),-1);
                    var m=0;
                    if(F.get_movable())
                    {
                        p=k.crossProduct(A.r0,o);
                        e.multiplyVector(F.get_worldInvInertia(),p);
                        m=F.invMass+k.dotProduct(o,k.crossProduct(p,A.r0));
                    }
                    if(E.get_movable())
                    {
                        p=k.crossProduct(A.r1,o);
                        e.multiplyVector(E.get_worldInvInertia(),p);
                        m+=(E.invMass+k.dotProduct(o,k.crossProduct(p,A.r1)));
                    }
                    if(m>b.NUM_TINY)
                    {
                        var n=y/m;
                        var l=b.getScaleVector(o,n);
                        var P=A.accumulatedFrictionImpulse.slice(0);
                        A.accumulatedFrictionImpulse=k.add(A.accumulatedFrictionImpulse,l);
                        var L=k.get_length(A.accumulatedFrictionImpulse);
                        var B=r.mat.friction*A.accumulatedNormalImpulse;
                        if(L>b.NUM_TINY&&L>B)
                        {
                            A.accumulatedFrictionImpulse=b.getScaleVector(A.accumulatedFrictionImpulse,B/L);
                        }
                        var x=k.subtract(A.accumulatedFrictionImpulse,P);
                        F.applyBodyWorldImpulse(x,A.r0);
                        E.applyBodyWorldImpulse(b.getScaleVector(x,-1),A.r1);
                    }
                }
            }
        }
        if(w)
        {
            F.setConstraintsAndCollisionsUnsatisfied();
            E.setConstraintsAndCollisionsUnsatisfied();
        }
        return w;
    };
    f.prototype.sortPositionX=function(m,l)
    {
        if(m.get_currentState().position[0]<l.get_currentState().position[0])
        {
            return -1;
        }
        else
        {
            if(m.get_currentState().position[0]>l.get_currentState().position[0])
            {
                return 1;
            }
            else
            {
                return 0;
            }
        }
    };
    f.prototype.sortPositionY=function(m,l)
    {
        if(m.get_currentState().position[1]<l.get_currentState().position[1])
        {
            return -1;
        }
        else
        {
            if(m.get_currentState().position[1]>l.get_currentState().position[1])
            {
                return 1;
            }
            else
            {
                return 0;
            }
        }
    };
    f.prototype.sortPositionZ=function(m,l)
    {
        if(m.get_currentState().position[2]<l.get_currentState().position[2])
        {
            return -1;
        }
        else
        {
            if(m.get_currentState().position[2]>l.get_currentState().position[2])
            {
                return 1;
            }
            else
            {
                return 0;
            }
        }
    };
    f.prototype.doShockStep=function(o)
    {
        if(Math.abs(this._gravity[0])>Math.abs(this._gravity[1])&&Math.abs(this._gravity[0])>Math.abs(this._gravity[2]))
        {
            this._bodies=this._bodies.sort(this.sortPositionX);
            this._collisionSystem.collBody=this._collisionSystem.collBody.sort(this.sortPositionX);
        }
        else
        {
            if(Math.abs(this._gravity[1])>Math.abs(this._gravity[2])&&Math.abs(this._gravity[1])>Math.abs(this._gravity[0]))
            {
                this._bodies=this._bodies.sort(this.sortPositionY);
                this._collisionSystem.collBody=this._collisionSystem.collBody.sort(this.sortPositionY);
            }
            else
            {
                if(Math.abs(this._gravity[2])>Math.abs(this._gravity[0])&&Math.abs(this._gravity[2])>Math.abs(this._gravity[1]))
                {
                    this._bodies=this._bodies.sort(this.sortPositionZ);
                    this._collisionSystem.collBody=this._collisionSystem.collBody.sort(this.sortPositionZ);
                }
            }
        }
        var p;
        var l;
        var q=true;
        var r=[];
        var n;
        var m;
        while(q)
        {
            q=false;
            for(var t=0; t<this._bodies.length; t++)
            {
                var u=this._bodies[t];
                if(u.get_movable()&&u.get_doShockProcessing())
                {
                    if(u.collisions.length==0||!u.isActive)
                    {
                        u.internalSetImmovable();
                    }
                    else
                    {
                        l=false;
                        r=u.collisions;
                        for(var s=0; s<r.length; s++)
                        {
                            p=r[s];
                            n=p.objInfo.body0;
                            m=p.objInfo.body1;
                            if((n==u&&!m.get_movable())||(m==u&&!n.get_movable()))
                            {
                                this.preProcessCollisionFast(p,o);
                                this.processCollision(p,o);
                                l=true;
                            }
                        }
                        if(l)
                        {
                            u.internalSetImmovable();
                            q=true;
                        }
                    }
                }
            }
        }
        for(var t=0; t<this._bodies.length; t++)
        {
            u=this._bodies[t];
            u.internalRestoreImmovable();
            r=u.collisions;
            for(var s=0; s<r.length; s++)
            {
                p=r[s];
                this.preProcessCollisionFn(p,o);
                this.processCollisionFn(p,o);
            }
        }
    };
    f.prototype.updateContactCache=function()
    {
        this._cachedContacts=[];
        var q;
        var s;
        var l;
        for(var o=0,m=this._collisions.length; o<m; o++)
        {
            var r=this._collisions[o];
            for(var n=0,p=r.pointInfo.length; n<p; n++)
            {
                q=r.pointInfo[n];
                s=(r.objInfo.body0.id>r.objInfo.body1.id)?q.accumulatedFrictionImpulse:b.getScaleVector(q.accumulatedFrictionImpulse,-1);
                l=new g();
                l.pair=new c(r.objInfo.body0,r.objInfo.body1,q.r0,q.r1);
                l.impulse=new a(q.accumulatedNormalImpulse,q.accumulatedNormalImpulseAux,q.accumulatedFrictionImpulse);
                this._cachedContacts.push(l);
            }
        }
    };
    f.prototype.handleAllConstraints=function(l,u,w)
    {
        var x=this._collisions.length;
        var t;
        var p;
        for(var q=0,v=this._constraints.length; q<v; q++)
        {
            this._constraints[q].preApply(l);
        }
        if(w)
        {
            for(var q=0,v=this._collisions.length; q<v; q++)
            {
                this.preProcessContactFn(this._collisions[q],l);
                this._collisions[q].mat.set_restitution(0);
                this._collisions[q].satisfied=false;
            }
        }
        else
        {
            for(var q=0,v=this._collisions.length; q<v; q++)
            {
                this.preProcessCollisionFn(this._collisions[q],l);
            }
        }
        var s;
        var n;
        var r;
        for(var m=0; m<u; m++)
        {
            n=false;
            for(var q=0,v=this._collisions.length; q<v; q++)
            {
                t=this._collisions[q];
                if(!t.satisfied)
                {
                    if(w)
                    {
                        s=this.processContactFn(t,l);
                        n=n||s;
                    }
                    else
                    {
                        s=this.processCollisionFn(t,l);
                        n=n||s;
                    }
                }
            }
            for(var q=0,v=this._constraints.length; q<v; q++)
            {
                var p=this._constraints[q];
                if(!p.get_satisfied())
                {
                    s=p.apply(l);
                    n=n||s;
                }
            }
            this.tryToActivateAllFrozenObjects();
            if(w)
            {
                r=this._collisions.length;
                for(var o=x; o<r; o++)
                {
                    this._collisions[o].mat.set_restitution(0);
                    this._collisions[o].satisfied=false;
                    this.preProcessContactFn(this._collisions[o],l);
                }
            }
            else
            {
                r=this._collisions.length;
                for(o=x; o<r; o++)
                {
                    this.preProcessCollisionFn(this._collisions[o],l);
                }
            }
            x=this._collisions.length;
            if(!n)
            {
                break;
            }
        }
    };
    f.prototype.handleAllEffects=function()
    {
        var m;
        var l=this._effects.length-1;
        if(l<0)
        {
            return;
        }
        do
        {
            m=this._effects[l];
            if(m.enabled)
            {
                m.Apply();
            }
        }
        while(l--);
    };
    f.prototype.activateObject=function(n)
    {
        if(!n.get_movable()||n.isActive)
        {
            return;
        }
        n.setActive();
        this._activeBodies.push(n);
        var p=this._collisions.length;
        this._collisionSystem.detectCollisions(n,this._collisions);
        var m;
        var q;
        for(var o=p,l=this._collisions.length; o<l; o++)
        {
            m=this._collisions[o].objInfo.body0;
            q=this._collisions[o].dirToBody;
            if(m==n)
            {
                m=this._collisions[o].objInfo.body1;
                q=b.getScaleVector(this._collisions[o].dirToBody,-1);
            }
            if(!m.isActive&&k.dotProduct(m.get_force(),q)<-b.NUM_TINY)
            {
                this.activateObject(m);
            }
        }
    };
    f.prototype.dampAllActiveBodies=function()
    {
        for(var l=0,m=this._activeBodies.length; l<m; l++)
        {
            _activeBody=this._activeBodies[l];
            _activeBody.dampForDeactivation();
        }
    };
    f.prototype.tryToActivateAllFrozenObjects=function()
    {
        for(var l=0,n=this._bodies.length; l<n; l++)
        {
            var m=this._bodies[l];
            if(!m.isActive)
            {
                if(m.getShouldBeActive())
                {
                    this.activateObject(m);
                }
                else
                {
                    if(m.getVelChanged())
                    {
                        m.setVelocity([0,0,0,0]);
                        m.setAngVel([0,0,0,0]);
                        m.clearVelChanged();
                    }
                }
            }
        }
    };
    f.prototype.activateAllFrozenObjectsLeftHanging=function()
    {
        var l;
        for(var n=0,q=this._bodies.length; n<q; n++)
        {
            var p=this._bodies[n];
            if(p.isActive)
            {
                p.doMovementActivations();
                if(p.collisions.length>0)
                {
                    for(var m=0,o=p.collisions.length; m<o; m++)
                    {
                        l=p.collisions[m].objInfo.body0;
                        if(l==p)
                        {
                            l=p.collisions[m].objInfo.body1;
                        }
                        if(!l.isActive)
                        {
                            p.addMovementActivation(p.get_currentState().position,l);
                        }
                    }
                }
            }
        }
    };
    f.prototype.updateAllVelocities=function(m)
    {
        for(var l=0,n=this._activeBodies.length; l<n; l++)
        {
            _activeBody=this._activeBodies[l];
            _activeBody.updateVelocity(m);
        }
    };
    f.prototype.updateAllPositions=function(m)
    {
        for(var l=0,n=this._activeBodies.length; l<n; l++)
        {
            _activeBody=this._activeBodies[l];
            _activeBody.updatePositionWithAux(m);
        }
    };
    f.prototype.notifyAllPostPhysics=function(m)
    {
        for(var l=0,n=this._bodies.length; l<n; l++)
        {
            _body=this._bodies[l];
            _body.postPhysics(m);
        }
    };
    f.prototype.updateAllObject3D=function()
    {
        for(var l=0,m=this._bodies.length; l<m; l++)
        {
            _body=this._bodies[l];
            _body.updateObject3D();
        }
    };
    f.prototype.limitAllVelocities=function()
    {
        for(var l=0,m=this._activeBodies.length; l<m; l++)
        {
            _activeBody=this._activeBodies[l];
            _activeBody.limitVel();
            _activeBody.limitAngVel();
        }
    };
    f.prototype.tryToFreezeAllObjects=function(m)
    {
        for(var l=0,n=this._activeBodies.length; l<n; l++)
        {
            _activeBody=this._activeBodies[l];
            _activeBody.tryToFreeze(m);
        }
    };
    f.prototype.detectAllCollisions=function(m)
    {
        for(var l=0,n=this._activeBodies.length; l<n; l++)
        {
            _activeBody=this._activeBodies[l];
            _activeBody.storeState();
        }
        this.updateAllVelocities(m);
        this.updateAllPositions(m);
        for(var l=0,o=this._bodies.length; l<o; l++)
        {
            _body=this._bodies[l];
            _body.collisions=[];
        }
        this._collisions=[];
        this._collisionSystem.detectAllCollisions(this._activeBodies,this._collisions);
        for(var l=0,n=this._activeBodies.length; l<n; l++)
        {
            _activeBody=this._activeBodies[l];
            _activeBody.restoreState();
        }
    };
    f.prototype.copyAllCurrentStatesToOld=function()
    {
        for(var l=0,m=this._bodies.length; l<m; l++)
        {
            _body=this._bodies[l];
            if(_body.isActive||_body.getVelChanged())
            {
                _body.copyCurrentStateToOld();
            }
        }
    };
    f.prototype.findAllActiveBodies=function()
    {
        this._activeBodies=[];
        for(var l=0,n=this._bodies.length; l<n; l++)
        {
            var m=this._bodies[l];
            if(m.isActive)
            {
                this._activeBodies.push(m);
            }
        }
    };
    f.prototype.integrate=function(m)
    {
        this._doingIntegration=true;
        this.findAllActiveBodies();
        this.copyAllCurrentStatesToOld();
        this.getAllExternalForces(m);
        this.handleAllEffects();
        this.detectAllCollisions(m);
        this.handleAllConstraints(m,h.numCollisionIterations,false);
        this.updateAllVelocities(m);
        this.handleAllConstraints(m,h.numContactIterations,true);
        if(h.doShockStep)
        {
            this.doShockStep(m);
        }
        this.dampAllActiveBodies();
        this.tryToFreezeAllObjects(m);
        this.activateAllFrozenObjectsLeftHanging();
        this.limitAllVelocities();
        this.updateAllPositions(m);
        this.notifyAllPostPhysics(m);
        this.updateAllObject3D();
        if(h.solverType=="ACCUMULATED")
        {
            this.updateContactCache();
        }
        for(var l=0,n=this._bodies.length; l<n; l++)
        {
            _body=this._bodies[l];
            _body.clearForces();
        }
        this._doingIntegration=false;
    };
    d.PhysicsSystem=f;
})(jigLib);