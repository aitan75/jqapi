"use strict";
let $rt_seed = 2463534242,
$rt_nextId = () => {
    let x = $rt_seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    $rt_seed = x;
    return x;
},
$rt_wrapFunction0 = f => function() {
    return f(this);
},
$rt_wrapFunction1 = f => function(p1) {
    return f(this, p1);
},
$rt_wrapFunction2 = f => function(p1, p2) {
    return f(this, p1, p2);
},
$rt_wrapFunction3 = f => function(p1, p2, p3) {
    return f(this, p1, p2, p3);
},
$rt_wrapFunction4 = f => function(p1, p2, p3, p4) {
    return f(this, p1, p2, p3, p4);
},
$rt_mainStarter = f => (args, callback) => {
    if (!args) {
        args = [];
    }
    let javaArgs = $rt_createArray($rt_objcls(), args.length);
    for (let i = 0;i < args.length;++i) {
        javaArgs.data[i] = $rt_str(args[i]);
    }
    $rt_startThread(() => {
        f.call(null, javaArgs);
    }, callback);
},
$rt_eraseClinit = target => target.$clinit = () => {
},
$dbg_class = obj => {
    let cls = obj.constructor;
    let arrayDegree = 0;
    while (cls[$rt_meta] && cls[$rt_meta].item) {
        ++arrayDegree;
        cls = cls[$rt_meta].item;
    }
    let clsName = "";
    if (cls[$rt_meta].primitiveKind !== 0) {
        clsName = cls[$rt_meta].name;
    } else {
        clsName = cls[$rt_meta] ? cls[$rt_meta].name || "a/" + cls.name : "@" + cls.name;
    }
    while (arrayDegree-- > 0) {
        clsName += "[]";
    }
    return clsName;
},
$rt_classWithoutFields = superclass => {
    if (superclass === 0) {
        return function() {
        };
    }
    if (superclass === void 0) {
        superclass = $rt_objcls();
    }
    return function() {
        superclass.call(this);
    };
},
$rt_meta = Symbol("teavm_meta"),
$rt_cls = cls => {
    if (cls[$rt_meta].classObject === null) {
        cls[$rt_meta].classObject = jl_Class_createClass(cls);
    }
    return cls[$rt_meta].classObject;
},
$rt_objcls = () => jl_Object,
$rt_getThread = () => {
    {
        return jl_Thread_currentThread();
    }
},
$rt_setThread = t => {
    {
        return jl_Thread_setCurrentThread(t);
    }
},
$rt_newClassMetadata = source => {
    return Object.assign({ name : null, binaryName : null, parent : null, superinterfaces : [], modifiers : 0, primitiveKind : 0, itemType : null, arrayType : null, enclosingClass : null, declaringClass : null, simpleName : null, clinit : () => {
    }, constructor : null, enumConstants : () => null, resolvedEnumConstants : null, reflection : null, classObject : null, assignableCache : null, valueToObject : o => o, objectToValue : o => o }, source || {  });
},
$rt_createPrimitiveCls = (name, binaryName, kind, config) => {
    let cls = () => {
    };
    let meta = $rt_newClassMetadata({ name : name, binaryName : binaryName, modifiers : 1 | 1 << 4, primitiveKind : kind });
    cls[$rt_meta] = meta;
    if (typeof config === 'function') {
        config(meta);
    }
    return cls;
},
$rt_booleancls = $rt_createPrimitiveCls("boolean", "Z", 1, meta => {
}),
$rt_bytecls = $rt_createPrimitiveCls("byte", "B", 2, meta => {
}),
$rt_shortcls = $rt_createPrimitiveCls("short", "S", 3, meta => {
}),
$rt_charcls = $rt_createPrimitiveCls("char", "C", 4, meta => {
}),
$rt_intcls = $rt_createPrimitiveCls("int", "I", 5, meta => {
    {
        meta.valueToObject = o => jl_Integer_valueOf(o);
    }
    {
        meta.objectToValue = o => jl_Integer_intValue(o);
    }
}),
$rt_longcls = $rt_createPrimitiveCls("long", "J", 6, meta => {
}),
$rt_doublecls = $rt_createPrimitiveCls("double", "D", 8, meta => {
    {
        meta.valueToObject = o => jl_Double_valueOf(o);
    }
    {
        meta.objectToValue = o => jl_Double_doubleValue(o);
    }
}),
$rt_voidcls = $rt_createPrimitiveCls("void", "V", 9),
$rt_numberConversionBuffer = new ArrayBuffer(16),
$rt_numberConversionDoubleArray = new Float64Array($rt_numberConversionBuffer),
$rt_numberConversionIntArray = new Int32Array($rt_numberConversionBuffer),
$rt_numberConversionLongArray = new BigInt64Array($rt_numberConversionBuffer),
$rt_doubleToRawLongBits = n => {
    $rt_numberConversionDoubleArray[0] = n;
    return $rt_numberConversionLongArray[0];
},
$rt_longBitsToDouble = n => {
    $rt_numberConversionLongArray[0] = n;
    return $rt_numberConversionDoubleArray[0];
},
$rt_equalDoubles = (a, b) => {
    if (a !== a) {
        return b !== b;
    }
    $rt_numberConversionDoubleArray[0] = a;
    $rt_numberConversionDoubleArray[1] = b;
    return $rt_numberConversionIntArray[0] === $rt_numberConversionIntArray[2] && $rt_numberConversionIntArray[1] === $rt_numberConversionIntArray[3];
},
$rt_compare = (a, b) => a === b ? 0 : a < b ?  -1 : 1,
$rt_compare_less = (a, b) => a === b ? 0 : a > b ? 1 :  -1,
$rt_imul = Math.imul || function(a, b) {
    let ah = a >>> 16 & 0xFFFF;
    let al = a & 0xFFFF;
    let bh = b >>> 16 & 0xFFFF;
    let bl = b & 0xFFFF;
    return al * bl + (ah * bl + al * bh << 16 >>> 0) | 0;
},
$rt_udiv = (a, b) => (a >>> 0) / (b >>> 0) >>> 0,
$rt_umod = (a, b) => (a >>> 0) % (b >>> 0) >>> 0,
$rt_ucmp = (a, b) => {
    a >>>= 0;
    b >>>= 0;
    return a < b ?  -1 : a > b ? 1 : 0;
},
Long_ZERO = BigInt(0),
Long_create = (lo, hi) => BigInt.asIntN(64, BigInt.asUintN(64, BigInt(lo)) | BigInt.asUintN(64, BigInt(hi) << BigInt(32))),
Long_fromInt = val => BigInt.asIntN(64, BigInt(val | 0)),
Long_fromNumber = val => BigInt.asIntN(64, BigInt(val >= 0 ? Math.floor(val) : Math.ceil(val))),
Long_toNumber = val => Number(val),
Long_hi = val => Number(BigInt.asIntN(64, val >> BigInt(32))) | 0,
Long_lo = val => Number(BigInt.asIntN(32, val)) | 0,
Long_eq = (a, b) => a === b,
Long_ne = (a, b) => a !== b,
Long_gt = (a, b) => a > b,
Long_ge = (a, b) => a >= b;
let Long_lt = (a, b) => a < b,
Long_le = (a, b) => a <= b,
Long_add = (a, b) => BigInt.asIntN(64, a + b),
Long_neg = a => BigInt.asIntN(64,  -a),
Long_sub = (a, b) => BigInt.asIntN(64, a - b),
Long_compare = (a, b) => a < b ?  -1 : a > b ? 1 : 0,
Long_ucompare = (a, b) => {
    a = BigInt.asUintN(64, a);
    b = BigInt.asUintN(64, b);
    return a < b ?  -1 : a > b ? 1 : 0;
},
Long_mul = (a, b) => BigInt.asIntN(64, a * b),
Long_div = (a, b) => BigInt.asIntN(64, a / b),
Long_udiv = (a, b) => BigInt.asIntN(64, BigInt.asUintN(64, a) / BigInt.asUintN(64, b)),
Long_rem = (a, b) => BigInt.asIntN(64, a % b),
Long_and = (a, b) => BigInt.asIntN(64, a & b),
Long_or = (a, b) => BigInt.asIntN(64, a | b),
Long_xor = (a, b) => BigInt.asIntN(64, a ^ b),
Long_shl = (a, b) => BigInt.asIntN(64, a << BigInt(b & 63)),
Long_shr = (a, b) => BigInt.asIntN(64, a >> BigInt(b & 63)),
Long_shru = (a, b) => BigInt.asIntN(64, BigInt.asUintN(64, a) >> BigInt(b & 63)),
$rt_createArray = (cls, sz) => {
    let data = new Array(sz);
    data.fill(null);
    return new ($rt_arraycls(cls))(data);
},
$rt_wrapArray = (cls, data) => new ($rt_arraycls(cls))(data),
$rt_createUnfilledArray = (cls, sz) => new ($rt_arraycls(cls))(new Array(sz)),
$rt_createLongArrayFromData = data => {
    let buffer = new BigInt64Array(data.length);
    buffer.set(data);
    return new $rt_longArrayCls(buffer);
},
$rt_createCharArray = sz => new $rt_charArrayCls(new Uint16Array(sz)),
$rt_createByteArray = sz => new $rt_byteArrayCls(new Int8Array(sz)),
$rt_createShortArrayFromData = data => {
    let buffer = new Int16Array(data.length);
    buffer.set(data);
    return new $rt_shortArrayCls(buffer);
},
$rt_createIntArray = sz => new $rt_intArrayCls(new Int32Array(sz)),
$rt_createIntArrayFromData = data => {
    let buffer = new Int32Array(data.length);
    buffer.set(data);
    return new $rt_intArrayCls(buffer);
},
$rt_createBooleanArray = sz => new $rt_booleanArrayCls(new Int8Array(sz)),
$rt_createDoubleArray = sz => new $rt_doubleArrayCls(new Float64Array(sz)),
$rt_arraycls = cls => {
    let result = cls[$rt_meta].arrayType;
    if (result === null) {
        function JavaArray(data) {
            ($rt_objcls()).call(this);
            this.data = data;
        }
        JavaArray.prototype = Object.create(($rt_objcls()).prototype);
        JavaArray.prototype.type = cls;
        JavaArray.prototype.constructor = JavaArray;
        JavaArray.prototype.toString = function() {
            let str = "[";
            for (let i = 0;i < this.data.length;++i) {
                if (i > 0) {
                    str += ", ";
                }
                str += this.data[i].toString();
            }
            str += "]";
            return str;
        };
        JavaArray.prototype.$clone0 = function() {
            let dataCopy;
            if ('slice' in this.data) {
                dataCopy = this.data.slice();
            } else {
                dataCopy = new this.data.constructor(this.data.length);
                for (let i = 0;i < dataCopy.length;++i) {
                    dataCopy[i] = this.data[i];
                }
            }
            return new ($rt_arraycls(this.type))(dataCopy);
        };
        let name = "[" + cls[$rt_meta].binaryName;
        JavaArray[$rt_meta] = $rt_newClassMetadata({ name : name, binaryName : name, parent : $rt_objcls(), itemType : cls });
        result = JavaArray;
        cls[$rt_meta].arrayType = JavaArray;
    }
    return result;
},
$rt_createMultiArray = (cls, dimensions) => {
    let first = 0;
    for (let i = dimensions.length - 1;i >= 0;i = i - 1 | 0) {
        if (dimensions[i] === 0) {
            first = i;
            break;
        }
    }
    if (first > 0) {
        for (let i = 0;i < first;i = i + 1 | 0) {
            cls = $rt_arraycls(cls);
        }
        if (first === dimensions.length - 1) {
            return $rt_createArray(cls, dimensions[first]);
        }
    }
    let arrays = new Array($rt_primitiveArrayCount(dimensions, first));
    let firstDim = dimensions[first] | 0;
    for (let i = 0;i < arrays.length;i = i + 1 | 0) {
        arrays[i] = $rt_createArray(cls, firstDim);
    }
    return $rt_createMultiArrayImpl(cls, arrays, dimensions, first, 0);
},
$rt_primitiveArrayCount = (dimensions, start) => {
    let val = dimensions[start + 1] | 0;
    for (let i = start + 2;i < dimensions.length;i = i + 1 | 0) {
        val = val * (dimensions[i] | 0) | 0;
        if (val === 0) {
            break;
        }
    }
    return val;
},
$rt_createMultiArrayImpl = (cls, arrays, dimensions, start) => {
    let limit = arrays.length;
    for (let i = start + 1 | 0;i < dimensions.length;i = i + 1 | 0) {
        cls = $rt_arraycls(cls);
        let dim = dimensions[i];
        let index = 0;
        let packedIndex = 0;
        while (index < limit) {
            let arr = $rt_createUnfilledArray(cls, dim);
            for (let j = 0;j < dim;j = j + 1 | 0) {
                arr.data[j] = arrays[index];
                index = index + 1 | 0;
            }
            arrays[packedIndex] = arr;
            packedIndex = packedIndex + 1 | 0;
        }
        limit = packedIndex;
    }
    return arrays[0];
};
function $rt_arrayLength(array) {
    return array.data.length;
}
let $rt_stringPool_instance,
$rt_stringPool = strings => {
    $rt_stringClassInit();
    $rt_stringPool_instance = new Array(strings.length);
    for (let i = 0;i < strings.length;++i) {
        $rt_stringPool_instance[i] = $rt_intern($rt_str(strings[i]));
    }
},
$rt_s = index => $rt_stringPool_instance[index],
$rt_charArrayToString = (array, offset, count) => {
    let result = "";
    let limit = offset + count;
    for (let i = offset;i < limit;i = i + 1024 | 0) {
        let next = Math.min(limit, i + 1024 | 0);
        result += String.fromCharCode.apply(null, array.subarray(i, next));
    }
    return result;
},
$rt_str = str => str === null ? null : jl_String__init_(str),
$rt_ustr = str => str === null ? null : str.$nativeString,
$rt_stringClassInit = () => jl_String_$callClinit(),
$rt_intern;
{
    $rt_intern = str => str;
}
let $rt_enumConstants = cls => {
    let meta = cls[$rt_meta];
    if (meta.resolvedEnumConstants === null) {
        let result = meta.enumConstants();
        meta.resolvedEnumConstants = result !== null ? result : [];
    }
    return meta.resolvedEnumConstants;
},
$rt_isInstance = (obj, cls) => obj instanceof $rt_objcls() && !!obj.constructor[$rt_meta] && $rt_isAssignable(obj.constructor, cls),
$rt_isAssignable = (from, to) => {
    if (from === to) {
        return true;
    }
    let map = from[$rt_meta].assignableCache;
    if (map === null) {
        map = new Map();
        from[$rt_meta].assignableCache = map;
    }
    let cachedResult = map.get(to);
    if (typeof cachedResult !== 'undefined') {
        return cachedResult;
    }
    if (to[$rt_meta].itemType !== null) {
        let result = from[$rt_meta].itemType !== null && $rt_isAssignable(from[$rt_meta].itemType, to[$rt_meta].itemType);
        map.set(to, result);
        return result;
    }
    let parent = from[$rt_meta].parent;
    if (parent !== null && parent !== from) {
        if ($rt_isAssignable(parent, to)) {
            map.set(to, true);
            return true;
        }
    }
    let superinterfaces = from[$rt_meta].superinterfaces;
    for (let i = 0;i < superinterfaces.length;i = i + 1 | 0) {
        if ($rt_isAssignable(superinterfaces[i], to)) {
            map.set(to, true);
            return true;
        }
    }
    map.set(to, false);
    return false;
},
$rt_throw = ex => {
    throw $rt_exception(ex);
},
$rt_javaExceptionProp = Symbol("javaException"),
$rt_exception = ex => {
    if (!ex.$jsException) {
        $rt_fillNativeException(ex);
    }
    return ex.$jsException;
},
$rt_fillNativeException = ex => {
    let javaCause = $rt_throwableCause(ex);
    let jsCause = javaCause !== null ? javaCause.$jsException : void 0;
    let cause = typeof jsCause === "object" ? { cause : jsCause } : void 0;
    let err = new JavaError("Java exception thrown", cause);
    if (typeof Error.captureStackTrace === "function") {
        Error.captureStackTrace(err);
    }
    err[$rt_javaExceptionProp] = ex;
    ex.$jsException = err;
    $rt_fillStack(err, ex);
},
$rt_fillStack = (err, ex) => {
    if (typeof $rt_decodeStack === "function" && err.stack) {
        let stack = $rt_decodeStack(err.stack);
        let javaStack = $rt_createArray($rt_stecls(), stack.length);
        let elem;
        let noStack = false;
        for (let i = 0;i < stack.length;++i) {
            let element = stack[i];
            elem = $rt_createStackElement($rt_str(element.className), $rt_str(element.methodName), $rt_str(element.fileName), element.lineNumber);
            if (elem == null) {
                noStack = true;
                break;
            }
            javaStack.data[i] = elem;
        }
        if (!noStack) {
            $rt_setStack(ex, javaStack);
        }
    }
},
JavaError;
if (typeof Reflect === 'object') {
    let defaultMessage = Symbol("defaultMessage");
    JavaError = function JavaError(message, cause) {
        let self = Reflect.construct(Error, [void 0, cause], JavaError);
        Object.setPrototypeOf(self, JavaError.prototype);
        self[defaultMessage] = message;
        return self;
    }
    ;
    JavaError.prototype = Object.create(Error.prototype, { constructor : { configurable : true, writable : true, value : JavaError }, message : { get() {
        try {
            let javaException = this[$rt_javaExceptionProp];
            if (typeof javaException === 'object') {
                let javaMessage = $rt_throwableMessage(javaException);
                if (typeof javaMessage === "object") {
                    return javaMessage !== null ? javaMessage.toString() : null;
                }
            }
            return this[defaultMessage];
        } catch (e){
            return "Exception occurred trying to extract Java exception message: " + e;
        }
    } } });
} else {
    JavaError = Error;
}
let $rt_javaException = e => e instanceof Error && typeof e[$rt_javaExceptionProp] === 'object' ? e[$rt_javaExceptionProp] : null,
$rt_wrapException = err => {
    let ex = err[$rt_javaExceptionProp];
    if (!ex) {
        ex = $rt_createException($rt_str("(JavaScript) " + err.toString()));
        err[$rt_javaExceptionProp] = ex;
        ex.$jsException = err;
        $rt_fillStack(err, ex);
    }
    return ex;
},
$rt_createException = message => jl_RuntimeException__init_2(message),
$rt_throwableMessage = t => jl_Throwable_getMessage(t),
$rt_throwableCause = t => jl_Throwable_getCause(t),
$rt_stecls = () => $rt_objcls(),
$rt_createStackElement = (className, methodName, fileName, lineNumber) => {
    {
        return null;
    }
},
$rt_setStack = (e, stack) => {
},
$rt_packageData = null,
$rt_packages = data => {
    let i = 0;
    let packages = new Array(data.length);
    for (let j = 0;j < data.length;++j) {
        let prefixIndex = data[i++];
        let prefix = prefixIndex >= 0 ? packages[prefixIndex] : "";
        packages[j] = prefix + data[i++] + ".";
    }
    $rt_packageData = packages;
},
$rt_allClasses = [],
$rt_metadata = data => {
    let packages = $rt_packageData;
    let i = 0;
    while (i < data.length) {
        let cls = data[i++];
        $rt_allClasses.push(cls);
        let m = $rt_newClassMetadata();
        cls[$rt_meta] = m;
        let className = data[i++];
        m.name = className !== 0 ? className : null;
        if (m.name !== null) {
            let packageIndex = data[i++];
            if (packageIndex >= 0) {
                m.name = packages[packageIndex] + m.name;
            }
        }
        m.binaryName = "L" + m.name + ";";
        let superclass = data[i++];
        m.parent = superclass !== 0 ? superclass : null;
        m.superinterfaces = data[i++];
        if (m.parent) {
            cls.prototype = Object.create(m.parent.prototype);
        } else {
            cls.prototype = {  };
        }
        cls.prototype.constructor = cls;
        m.modifiers = data[i++];
        m.primitiveKind = 0;
        let innerClassInfo = data[i++];
        if (innerClassInfo !== 0) {
            let enclosingClass = innerClassInfo[0];
            m.enclosingClass = enclosingClass !== 0 ? enclosingClass : null;
            let declaringClass = innerClassInfo[1];
            m.declaringClass = declaringClass !== 0 ? declaringClass : null;
            let simpleName = innerClassInfo[2];
            m.simpleName = simpleName !== 0 ? simpleName : null;
        }
        let clinit = data[i++];
        m.clinit = clinit !== 0 ? () => {
            m.clinit = () => {
            };
            clinit();
        } : () => {
        };
        let virtualMethods = data[i++];
        if (virtualMethods !== 0) {
            for (let j = 0;j < virtualMethods.length;j += 2) {
                let name = virtualMethods[j];
                let func = virtualMethods[j + 1];
                if (typeof name === 'string') {
                    name = [name];
                }
                for (let k = 0;k < name.length;++k) {
                    cls.prototype[name[k]] = func;
                }
            }
        }
    }
},
$rt_enumConstantsMetadata = data => {
    let i = 0;
    while (i < data.length) {
        let cls = data[i++];
        cls[$rt_meta].enumConstants = data[i++];
    }
};
function TeaVMThread(runner) {
    this.status = 3;
    this.stack = [];
    this.suspendCallback = null;
    this.runner = runner;
    this.attribute = null;
    this.completeCallback = null;
}
TeaVMThread.prototype.push = function() {
    for (let i = 0;i < arguments.length;++i) {
        this.stack.push(arguments[i]);
    }
    return this;
};
TeaVMThread.prototype.s = TeaVMThread.prototype.push;
TeaVMThread.prototype.pop = function() {
    return this.stack.pop();
};
TeaVMThread.prototype.l = TeaVMThread.prototype.pop;
TeaVMThread.prototype.isResuming = function() {
    return this.status === 2;
};
TeaVMThread.prototype.isSuspending = function() {
    return this.status === 1;
};
TeaVMThread.prototype.suspend = function(callback) {
    this.suspendCallback = callback;
    this.status = 1;
};
TeaVMThread.prototype.start = function(callback) {
    if (this.status !== 3) {
        throw new Error("Thread already started");
    }
    if ($rt_currentNativeThread !== null) {
        throw new Error("Another thread is running");
    }
    this.status = 0;
    this.completeCallback = callback ? callback : result => {
        if (result instanceof Error) {
            throw result;
        }
    };
    this.run();
};
TeaVMThread.prototype.resume = function() {
    if ($rt_currentNativeThread !== null) {
        throw new Error("Another thread is running");
    }
    this.status = 2;
    this.run();
};
TeaVMThread.prototype.run = function() {
    $rt_currentNativeThread = this;
    let result;
    try {
        result = this.runner();
    } catch (e){
        result = e;
    } finally {
        $rt_currentNativeThread = null;
    }
    if (this.suspendCallback !== null) {
        let self = this;
        let callback = this.suspendCallback;
        this.suspendCallback = null;
        callback(() => self.resume());
    } else if (this.status === 0) {
        this.completeCallback(result);
    }
};
let $rt_suspending = () => {
    let thread = $rt_nativeThread();
    return thread != null && thread.isSuspending();
},
$rt_resuming = () => {
    let thread = $rt_nativeThread();
    return thread != null && thread.isResuming();
},
$rt_requireNativeThread = () => {
    let nativeThread = $rt_nativeThread();
    if (nativeThread === null) {
        throw new Error("Suspension point reached from non-threading context " + "(perhaps, from native JS method). See https://teavm.org/docs/runtime/coroutines.html " + "('Interaction with JavaScript' section)");
    }
    return nativeThread;
},
$rt_startThread = (runner, callback) => (new TeaVMThread(runner)).start(callback),
$rt_currentNativeThread = null,
$rt_nativeThread = () => $rt_currentNativeThread,
$rt_invalidPointer = () => {
    throw new Error("Invalid recorded state");
};
function jl_Object() {
    this.$monitor = null;
    this.$id$ = 0;
}
let jl_Object_monitorEnterSync = $o => {
    let var$2;
    if (jl_Thread_currentThread() === null)
        return;
    if ($o.$monitor === null)
        jl_Object_createMonitor($o);
    if ($o.$monitor.$owner === null)
        $o.$monitor.$owner = jl_Thread_currentThread();
    else if ($o.$monitor.$owner !== jl_Thread_currentThread())
        $rt_throw(jl_IllegalStateException__init_0($rt_s(0)));
    var$2 = $o.$monitor;
    var$2.$count0 = var$2.$count0 + 1 | 0;
},
jl_Object_monitorExitSync = $o => {
    let var$2, var$3;
    if (jl_Thread_currentThread() === null)
        return;
    if (!jl_Object_isEmptyMonitor($o) && $o.$monitor.$owner === jl_Thread_currentThread()) {
        var$2 = $o.$monitor;
        var$3 = var$2.$count0 - 1 | 0;
        var$2.$count0 = var$3;
        if (!var$3)
            $o.$monitor.$owner = null;
        jl_Object_isEmptyMonitor($o);
        return;
    }
    $rt_throw(jl_IllegalMonitorStateException__init_0());
},
jl_Object_monitorEnter0 = $o => {
    let var$2, $ptr, $tmp;
    $ptr = 0;
    if ($rt_resuming()) {
        let $thread = $rt_nativeThread();
        $ptr = $thread.pop();var$2 = $thread.pop();$o = $thread.pop();
    }
    main: while (true) { switch ($ptr) {
    case 0:
        var$2 = 1;
        $ptr = 1;
    case 1:
        jl_Object_monitorEnter($o, var$2);
        if ($rt_suspending()) {
            break main;
        }
        return;
    default: $rt_invalidPointer();
    }}
    $rt_nativeThread().push($o, var$2, $ptr);
},
jl_Object_monitorEnter = ($o, $count) => {
    let var$3, $ptr, $tmp;
    $ptr = 0;
    if ($rt_resuming()) {
        let $thread = $rt_nativeThread();
        $ptr = $thread.pop();var$3 = $thread.pop();$count = $thread.pop();$o = $thread.pop();
    }
    main: while (true) { switch ($ptr) {
    case 0:
        if ($o.$monitor === null)
            jl_Object_createMonitor($o);
        if ($o.$monitor.$owner === null)
            $o.$monitor.$owner = jl_Thread_currentThread();
        if ($o.$monitor.$owner === jl_Thread_currentThread()) {
            var$3 = $o.$monitor;
            var$3.$count0 = var$3.$count0 + $count | 0;
            return;
        }
        $ptr = 1;
    case 1:
        jl_Object_monitorEnterWait($o, $count);
        if ($rt_suspending()) {
            break main;
        }
        return;
    default: $rt_invalidPointer();
    }}
    $rt_nativeThread().push($o, $count, var$3, $ptr);
},
jl_Object_createMonitor = $o => {
    $o.$monitor = jl_Object$Monitor__init_0();
},
jl_Object_monitorEnterWait = (var$1, var$2) => {
    let $ptr, $tmp;
    $ptr = 0;
    if ($rt_resuming()) {
        let $thread = $rt_nativeThread();
        $ptr = $thread.pop();var$2 = $thread.pop();var$1 = $thread.pop();
    }
    main: while (true) { switch ($ptr) {
    case 0:
        $ptr = 1;
    case 1:
        jl_Object_monitorEnterWait$_asyncCall_$(var$1, var$2);
        if ($rt_suspending()) {
            break main;
        }
        return;
    default: $rt_invalidPointer();
    }}
    $rt_nativeThread().push(var$1, var$2, $ptr);
},
jl_Object_monitorEnterWait0 = ($o, $count, $callback) => {
    let $thread_0, var$5, $monitor;
    $thread_0 = jl_Thread_currentThread();
    if ($o.$monitor === null) {
        jl_Object_createMonitor($o);
        jl_Thread_setCurrentThread($thread_0);
        var$5 = $o.$monitor;
        var$5.$count0 = var$5.$count0 + $count | 0;
        $callback.$complete(null);
        return;
    }
    if ($o.$monitor.$owner === null) {
        $o.$monitor.$owner = $thread_0;
        jl_Thread_setCurrentThread($thread_0);
        var$5 = $o.$monitor;
        var$5.$count0 = var$5.$count0 + $count | 0;
        $callback.$complete(null);
        return;
    }
    $monitor = $o.$monitor;
    if ($monitor.$enteringThreads === null)
        $monitor.$enteringThreads = ju_ArrayDeque__init_1();
    $monitor.$enteringThreads.$add(jl_Object$monitorEnterWait$lambda$_6_0__init_0($thread_0, $o, $count, $callback));
},
jl_Object_monitorExit0 = $o => {
    jl_Object_monitorExit($o, 1);
},
jl_Object_monitorExit = ($o, $count) => {
    let $monitor;
    if (!jl_Object_isEmptyMonitor($o) && $o.$monitor.$owner === jl_Thread_currentThread()) {
        $monitor = $o.$monitor;
        $monitor.$count0 = $monitor.$count0 - $count | 0;
        if ($monitor.$count0 > 0)
            return;
        $monitor.$owner = null;
        if ($monitor.$enteringThreads !== null && !$monitor.$enteringThreads.$isEmpty())
            otp_Platform_postpone(jl_Object$monitorExit$lambda$_8_1__init_0($o));
        else
            jl_Object_isEmptyMonitor($o);
        return;
    }
    $rt_throw(jl_IllegalMonitorStateException__init_0());
},
jl_Object_waitForOtherThreads = $o => {
    let $monitor, $enteringThreads, $r;
    if (!jl_Object_isEmptyMonitor($o) && $o.$monitor.$owner === null) {
        $monitor = $o.$monitor;
        if ($monitor.$enteringThreads !== null && !$monitor.$enteringThreads.$isEmpty()) {
            $enteringThreads = $monitor.$enteringThreads;
            $r = $enteringThreads.$remove();
            $monitor.$enteringThreads = null;
            $r.$run();
        }
        return;
    }
},
jl_Object_isEmptyMonitor = $this => {
    let $monitor, var$2;
    $monitor = $this.$monitor;
    if ($monitor === null)
        return 1;
    a: {
        b: {
            if ($monitor.$owner === null) {
                if ($monitor.$enteringThreads !== null) {
                    var$2 = $monitor.$enteringThreads;
                    if (!var$2.$isEmpty())
                        break b;
                }
                if ($monitor.$notifyListeners === null)
                    break a;
                var$2 = $monitor.$notifyListeners;
                if (var$2.$isEmpty())
                    break a;
            }
        }
        return 0;
    }
    jl_Object_deleteMonitor($this);
    return 1;
},
jl_Object_deleteMonitor = $this => {
    $this.$monitor = null;
},
jl_Object__init_ = $this => {
    return;
},
jl_Object__init_0 = () => {
    let var_0 = new jl_Object();
    jl_Object__init_(var_0);
    return var_0;
},
jl_Object_getClass = $this => {
    return $rt_cls(jl_Object_getClassInfo($this));
},
jl_Object_getClassInfo = var$0 => {
    return var$0.constructor;
},
jl_Object_hashCode = var$0 => {
    return jl_Object_identity(var$0);
},
jl_Object_equals = ($this, $other) => {
    return $this !== $other ? 0 : 1;
},
jl_Object_toString = $this => {
    let var$1, var$2, var$3;
    var$1 = jl_Class_getName(jl_Object_getClass($this));
    var$2 = jl_Integer_toHexString(jl_Object_identity($this));
    var$3 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append0(jl_StringBuilder_append(var$3, var$1), 64), var$2);
    return jl_StringBuilder_toString(var$3);
},
jl_Object_identity = $this => {
    let $platformThis;
    $platformThis = $this;
    if (!$platformThis.$id$)
        $platformThis.$id$ = $rt_nextId();
    return $this.$id$;
},
jl_Object_clone = $this => {
    let $cls, $result, var$3, var$4;
    $cls = jl_Class_getClassInfo(jl_Object_getClass($this));
    if (!$rt_isInstance($this, jl_Cloneable) && $cls[$rt_meta].itemType === null)
        $rt_throw(jl_CloneNotSupportedException__init_0());
    $result = otp_Platform_clone($this);
    var$3 = $result;
    var$4 = $rt_nextId();
    var$3.$id$ = var$4;
    return $result;
},
jl_Object_lambda$monitorExit$2 = $o => {
    jl_Object_waitForOtherThreads($o);
},
jl_Object_lambda$monitorEnterWait$0 = ($thread_0, $o, $count, $callback) => {
    let var$5;
    jl_Thread_setCurrentThread($thread_0);
    $o.$monitor.$owner = $thread_0;
    var$5 = $o.$monitor;
    var$5.$count0 = var$5.$count0 + $count | 0;
    $callback.$complete(null);
},
jl_Object_monitorEnterWait$_asyncCall_$ = (var$1, var$2) => {
    let thread = $rt_requireNativeThread();
    let javaThread = $rt_getThread();
    if (thread.isResuming()) {
        thread.status = 0;
        let result = thread.attribute;
        if (result instanceof Error) {
            throw result;
        }
        return result;
    }
    let callback = function() {
    };
    callback.$complete = val => {
        thread.attribute = val;
        $rt_setThread(javaThread);
        thread.resume();
    };
    callback.$error0 = e => {
        thread.attribute = $rt_exception(e);
        $rt_setThread(javaThread);
        thread.resume();
    };
    callback = otpp_AsyncCallbackWrapper_create(callback);
    thread.suspend(() => {
        try {
            jl_Object_monitorEnterWait0(var$1, var$2, callback);
            ;
        } catch ($e){
            callback.$error0($e);
        }
    });
    return null;
};
function oajqg_Gate() {
    let a = this; jl_Object.call(a);
    a.$matrix1 = null;
    a.$numberQubits = 0;
    a.$indexes = null;
    a.$size3 = 0;
    a.$type = null;
}
let oajqg_Gate__init_ = ($this, var$1, var$2, $type, $idxs) => {
    jl_Object__init_($this);
    if (!oajqg_Gate_verify($this, $idxs))
        $rt_throw(jl_IllegalArgumentException__init_($rt_s(1)));
    $this.$numberQubits = var$1;
    $this.$matrix1 = var$2;
    $this.$indexes = ju_Arrays_asList($idxs);
    $this.$type = $type;
    $this.$size3 = jl_Math_pow(2.0, var$1) | 0;
},
oajqg_Gate_getMatrix = $this => {
    return $this.$matrix1;
},
oajqg_Gate_getIndexes = $this => {
    return $this.$indexes;
},
oajqg_Gate_getType = $this => {
    return $this.$type;
},
oajqg_Gate_getNumberQubits = $this => {
    return $this.$numberQubits;
},
oajqg_Gate_verify = ($this, $idxs) => {
    let var$2;
    var$2 = $idxs.data.length;
    return var$2 <= 1 ? 1 : Long_ne((((ju_Arrays_asList($idxs)).$stream()).$distinct()).$count(), Long_fromInt(var$2)) ? 0 : 1;
},
oajqg_MultiControlled = $rt_classWithoutFields(oajqg_Gate),
oajqg_MultiControlled__init_ = ($this, $u, $numControls, $indexes) => {
    let var$4, var$5, var$6;
    var$4 = $numControls + jl_Integer_numberOfTrailingZeros($u.$getRowDimension()) | 0;
    var$5 = oajm_ComplexMatrix_multiControlledMatrix($u, $numControls);
    var$6 = oajqg_MultiControlled_requireIndexCount($u, $numControls, $indexes);
    oajqg_Gate__init_($this, var$4, var$5, $rt_s(2), var$6);
},
oajqg_MultiControlled__init_0 = (var_0, var_1, var_2) => {
    let var_3 = new oajqg_MultiControlled();
    oajqg_MultiControlled__init_(var_3, var_0, var_1, var_2);
    return var_3;
},
oajqg_MultiControlled_requireIndexCount = ($u, $numControls, $indexes) => {
    let var$4, $t, $expected, var$7;
    var$4 = $indexes.data;
    $t = jl_Integer_numberOfTrailingZeros($u.$getRowDimension());
    $expected = $numControls + $t | 0;
    var$7 = var$4.length;
    if (var$7 == $expected)
        return $indexes;
    $rt_throw(jl_IllegalArgumentException__init_((((((((((jl_StringBuilder__init_()).$append1($rt_s(3))).$append2($expected)).$append1($rt_s(4))).$append2($numControls)).$append1($rt_s(5))).$append2($t)).$append1($rt_s(6))).$append2(var$7)).$toString()));
};
function jl_Throwable() {
    let a = this; jl_Object.call(a);
    a.$message = null;
    a.$cause = null;
    a.$suppressionEnabled = 0;
    a.$writableStackTrace = 0;
}
let jl_Throwable__init_ = $this => {
    jl_Throwable_initNativeException($this);
    $this.$suppressionEnabled = 1;
    $this.$writableStackTrace = 1;
    $this.$fillInStackTrace();
},
jl_Throwable__init_4 = () => {
    let var_0 = new jl_Throwable();
    jl_Throwable__init_(var_0);
    return var_0;
},
jl_Throwable__init_0 = ($this, $message) => {
    jl_Throwable_initNativeException($this);
    $this.$suppressionEnabled = 1;
    $this.$writableStackTrace = 1;
    $this.$fillInStackTrace();
    $this.$message = $message;
},
jl_Throwable__init_2 = var_0 => {
    let var_1 = new jl_Throwable();
    jl_Throwable__init_0(var_1, var_0);
    return var_1;
},
jl_Throwable__init_1 = ($this, $message, $cause) => {
    jl_Throwable_initNativeException($this);
    $this.$suppressionEnabled = 1;
    $this.$writableStackTrace = 1;
    $this.$fillInStackTrace();
    $this.$message = $message;
    $this.$cause = $cause;
},
jl_Throwable__init_3 = (var_0, var_1) => {
    let var_2 = new jl_Throwable();
    jl_Throwable__init_1(var_2, var_0, var_1);
    return var_2;
},
jl_Throwable_fillInStackTrace = $this => {
    return $this;
},
jl_Throwable_initNativeException = $this => {
    $rt_fillNativeException($this);
},
jl_Throwable_getMessage = $this => {
    return $this.$message;
},
jl_Throwable_getCause = $this => {
    return $this.$cause === $this ? null : $this.$cause;
},
jl_Exception = $rt_classWithoutFields(jl_Throwable),
jl_Exception__init_ = $this => {
    jl_Throwable__init_($this);
},
jl_Exception__init_2 = () => {
    let var_0 = new jl_Exception();
    jl_Exception__init_(var_0);
    return var_0;
},
jl_Exception__init_1 = ($this, $message, $cause) => {
    jl_Throwable__init_1($this, $message, $cause);
},
jl_Exception__init_4 = (var_0, var_1) => {
    let var_2 = new jl_Exception();
    jl_Exception__init_1(var_2, var_0, var_1);
    return var_2;
},
jl_Exception__init_0 = ($this, $message) => {
    jl_Throwable__init_0($this, $message);
},
jl_Exception__init_3 = var_0 => {
    let var_1 = new jl_Exception();
    jl_Exception__init_0(var_1, var_0);
    return var_1;
},
jl_RuntimeException = $rt_classWithoutFields(jl_Exception),
jl_RuntimeException__init_ = $this => {
    jl_Exception__init_($this);
},
jl_RuntimeException__init_3 = () => {
    let var_0 = new jl_RuntimeException();
    jl_RuntimeException__init_(var_0);
    return var_0;
},
jl_RuntimeException__init_1 = ($this, $message, $cause) => {
    jl_Exception__init_1($this, $message, $cause);
},
jl_RuntimeException__init_4 = (var_0, var_1) => {
    let var_2 = new jl_RuntimeException();
    jl_RuntimeException__init_1(var_2, var_0, var_1);
    return var_2;
},
jl_RuntimeException__init_0 = ($this, $message) => {
    jl_Exception__init_0($this, $message);
},
jl_RuntimeException__init_2 = var_0 => {
    let var_1 = new jl_RuntimeException();
    jl_RuntimeException__init_0(var_1, var_0);
    return var_1;
},
jl_IndexOutOfBoundsException = $rt_classWithoutFields(jl_RuntimeException),
jl_IndexOutOfBoundsException__init_0 = $this => {
    jl_RuntimeException__init_($this);
},
jl_IndexOutOfBoundsException__init_ = () => {
    let var_0 = new jl_IndexOutOfBoundsException();
    jl_IndexOutOfBoundsException__init_0(var_0);
    return var_0;
},
ju_Enumeration = $rt_classWithoutFields(0),
juf_Consumer = $rt_classWithoutFields(0);
function oajq_Circuit$initializeLevels$lambda$_8_2() {
    jl_Object.call(this);
    this.$_021 = null;
}
let oajq_Circuit$initializeLevels$lambda$_8_2__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_021 = var$1;
},
oajq_Circuit$initializeLevels$lambda$_8_2__init_0 = var_0 => {
    let var_1 = new oajq_Circuit$initializeLevels$lambda$_8_2();
    oajq_Circuit$initializeLevels$lambda$_8_2__init_(var_1, var_0);
    return var_1;
},
oajq_Circuit$initializeLevels$lambda$_8_2_accept0 = (var$0, var$1) => {
    oajq_Circuit$initializeLevels$lambda$_8_2_accept(var$0, var$1);
},
oajq_Circuit$initializeLevels$lambda$_8_2_accept = (var$0, var$1) => {
    oajq_Circuit_lambda$initializeLevels$4(var$0.$_021, var$1);
},
jl_Record = $rt_classWithoutFields(),
jl_Record__init_ = $this => {
    jl_Object__init_($this);
},
oajv_CircuitSpecs = $rt_classWithoutFields(),
oajv_CircuitSpecs_KIND_BY_TYPE = null,
oajv_CircuitSpecs_$callClinit = () => {
    oajv_CircuitSpecs_$callClinit = $rt_eraseClinit(oajv_CircuitSpecs);
    oajv_CircuitSpecs__clinit_();
},
oajv_CircuitSpecs_toCircuit = ($spec, $config) => {
    let $circuit, var$4, $levelSpec, $level, var$7, $gateSpec, $gate, var$10;
    oajv_CircuitSpecs_$callClinit();
    $circuit = oajq_Circuit__init_0(oajvs_CircuitSpec_numQubits($spec), $config);
    var$4 = (oajvs_CircuitSpec_levels($spec)).$iterator();
    while (var$4.$hasNext()) {
        $levelSpec = var$4.$next();
        $level = oajq_CircuitLevel__init_0();
        var$7 = (oajvs_LevelSpec_gates($levelSpec)).$iterator();
        while (var$7.$hasNext()) {
            $gateSpec = var$7.$next();
            $gate = oajv_CircuitSpecs_build($gateSpec);
            if ($gate !== null)
                $level.$addGate($gate);
        }
        var$10 = $rt_createArray(oajq_CircuitLevel, 1);
        var$10.data[0] = $level;
        $circuit.$addLevel(var$10);
    }
    return $circuit;
},
oajv_CircuitSpecs_build = $g => {
    let $t, $c, var$4;
    oajv_CircuitSpecs_$callClinit();
    a: {
        $t = oajvs_GateSpec_targets($g);
        $c = oajvs_GateSpec_controls($g);
        oajv_CircuitSpecs$1_$callClinit();
        switch (oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateSpec_kind($g))]) {
            case 1:
                break;
            case 2:
                var$4 = oajqg_Hadamard__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 3:
                var$4 = oajqg_PauliX__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 4:
                var$4 = oajqg_PauliY__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 5:
                var$4 = oajqg_PauliZ__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 6:
                var$4 = oajqg_PauliS__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 7:
                var$4 = oajqg_PauliT__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 8:
                var$4 = oajqg_Measurement__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 9:
                var$4 = oajqg_Reset__init_0(oajv_CircuitSpecs_arr($t));
                break a;
            case 10:
                var$4 = oajqg_Rx__init_0(oajv_CircuitSpecs_param($g, $rt_s(7)), oajv_CircuitSpecs_arr($t));
                break a;
            case 11:
                var$4 = oajqg_Ry__init_0(oajv_CircuitSpecs_param($g, $rt_s(7)), oajv_CircuitSpecs_arr($t));
                break a;
            case 12:
                var$4 = oajqg_Rz__init_0(oajv_CircuitSpecs_param($g, $rt_s(7)), oajv_CircuitSpecs_arr($t));
                break a;
            case 13:
                var$4 = oajqg_Phase__init_0(oajv_CircuitSpecs_param($g, $rt_s(7)), oajv_CircuitSpecs_arr($t));
                break a;
            case 14:
                var$4 = oajqg_U3__init_0(oajv_CircuitSpecs_param($g, $rt_s(7)), oajv_CircuitSpecs_param($g, $rt_s(8)), oajv_CircuitSpecs_param($g, $rt_s(9)), oajv_CircuitSpecs_arr($t));
                break a;
            case 15:
                var$4 = oajqg_ControlledNot__init_0($c.$get(0), $t.$get(0));
                break a;
            case 16:
                var$4 = oajqg_ControlledY__init_0($c.$get(0), $t.$get(0));
                break a;
            case 17:
                var$4 = oajqg_ControlledZ__init_0($c.$get(0), $t.$get(0));
                break a;
            case 18:
                var$4 = oajqg_Swap__init_0($t.$get(0), $t.$get(1));
                break a;
            case 19:
                var$4 = oajqg_ControlledSwap__init_0($c.$get(0), $t.$get(0), $t.$get(1));
                break a;
            case 20:
                var$4 = oajqg_Toffoli__init_0($c.$get(0), $c.$get(1), $t.$get(0));
                break a;
            case 21:
                var$4 = oajqg_MultiControlled__init_0(oajv_CircuitSpecs_matrixOf($g), $c.$size(), oajv_CircuitSpecs_controlsThenTargets($g));
                break a;
            case 22:
                var$4 = oajqg_Oracle__init_0(oajv_CircuitSpecs_matrixOf($g), oajv_CircuitSpecs_arr($t));
                break a;
            case 23:
                var$4 = oajqg_GenericGate__init_0(oajv_CircuitSpecs_matrixOf($g), $t.$size(), oajv_CircuitSpecs_arr($t));
                break a;
            default:
                $rt_throw(jl_MatchException__init_0(null, null));
        }
        var$4 = null;
    }
    return var$4;
},
oajv_CircuitSpecs_param = ($g, $name) => {
    let $v;
    oajv_CircuitSpecs_$callClinit();
    $v = (oajvs_GateSpec_params($g)).$get0($name);
    return $v !== null ? $v.$doubleValue() : 0.0;
},
oajv_CircuitSpecs_arr = $list => {
    oajv_CircuitSpecs_$callClinit();
    return $list.$toArray($rt_createArray(jl_Integer, 0));
},
oajv_CircuitSpecs_controlsThenTargets = $g => {
    let $all;
    oajv_CircuitSpecs_$callClinit();
    $all = ju_ArrayList__init_4(oajvs_GateSpec_controls($g));
    $all.$addAll(oajvs_GateSpec_targets($g));
    return $all.$toArray($rt_createArray(jl_Integer, 0));
},
oajv_CircuitSpecs_matrixOf = $g => {
    let $cells, $rows, $cols, $data, $r, $row, $col;
    oajv_CircuitSpecs_$callClinit();
    if (oajvs_GateSpec_matrix($g) === null)
        $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append(oajvs_GateSpec_kind($g))).$append1($rt_s(10))).$toString()));
    $cells = oajvs_GateSpec_matrix($g);
    $rows = $cells.$size();
    $cols = ($cells.$get(0)).$size();
    $data = $rt_createMultiArray(oajm_Complex, [$cols, $rows]);
    $r = 0;
    while ($r < $rows) {
        $row = $cells.$get($r);
        $col = 0;
        while ($col < $cols) {
            $data.data[$r].data[$col] = oajm_Complex__init_(oajvs_ComplexCell_re($row.$get($col)), oajvs_ComplexCell_im($row.$get($col)));
            $col = $col + 1 | 0;
        }
        $r = $r + 1 | 0;
    }
    return oajm_ComplexMatrix_createMatrixWithData($data);
},
oajv_CircuitSpecs__clinit_ = () => {
    let var$1, var$2, var$3;
    var$1 = $rt_createArray(ju_Map$Entry, 23);
    var$2 = var$1.data;
    oajvs_GateKind_$callClinit();
    var$3 = oajvs_GateKind_H;
    var$2[0] = ju_Map_entry($rt_s(11), var$3);
    var$3 = oajvs_GateKind_X;
    var$2[1] = ju_Map_entry($rt_s(12), var$3);
    var$3 = oajvs_GateKind_Y;
    var$2[2] = ju_Map_entry($rt_s(13), var$3);
    var$3 = oajvs_GateKind_Z;
    var$2[3] = ju_Map_entry($rt_s(14), var$3);
    var$3 = oajvs_GateKind_S;
    var$2[4] = ju_Map_entry($rt_s(15), var$3);
    var$3 = oajvs_GateKind_T;
    var$2[5] = ju_Map_entry($rt_s(16), var$3);
    var$3 = oajvs_GateKind_IDENTITY;
    var$2[6] = ju_Map_entry($rt_s(17), var$3);
    var$3 = oajvs_GateKind_MEASUREMENT;
    var$2[7] = ju_Map_entry($rt_s(18), var$3);
    var$3 = oajvs_GateKind_RESET;
    var$2[8] = ju_Map_entry($rt_s(19), var$3);
    var$3 = oajvs_GateKind_CNOT;
    var$2[9] = ju_Map_entry($rt_s(20), var$3);
    var$3 = oajvs_GateKind_CZ;
    var$2[10] = ju_Map_entry($rt_s(21), var$3);
    var$3 = oajvs_GateKind_CY;
    var$2[11] = ju_Map_entry($rt_s(22), var$3);
    var$3 = oajvs_GateKind_SWAP;
    var$2[12] = ju_Map_entry($rt_s(23), var$3);
    var$3 = oajvs_GateKind_CSWAP;
    var$2[13] = ju_Map_entry($rt_s(24), var$3);
    var$3 = oajvs_GateKind_TOFFOLI;
    var$2[14] = ju_Map_entry($rt_s(25), var$3);
    var$3 = oajvs_GateKind_RX;
    var$2[15] = ju_Map_entry($rt_s(26), var$3);
    var$3 = oajvs_GateKind_RY;
    var$2[16] = ju_Map_entry($rt_s(27), var$3);
    var$3 = oajvs_GateKind_RZ;
    var$2[17] = ju_Map_entry($rt_s(28), var$3);
    var$3 = oajvs_GateKind_PHASE;
    var$2[18] = ju_Map_entry($rt_s(29), var$3);
    var$3 = oajvs_GateKind_U3;
    var$2[19] = ju_Map_entry($rt_s(30), var$3);
    var$3 = oajvs_GateKind_MULTI_CONTROLLED;
    var$2[20] = ju_Map_entry($rt_s(2), var$3);
    var$3 = oajvs_GateKind_ORACLE;
    var$2[21] = ju_Map_entry($rt_s(31), var$3);
    var$3 = oajvs_GateKind_GENERIC;
    var$2[22] = ju_Map_entry($rt_s(32), var$3);
    oajv_CircuitSpecs_KIND_BY_TYPE = ju_Map_ofEntries(var$1);
},
oajqg_Rz = $rt_classWithoutFields(oajqg_Gate),
oajqg_Rz__init_ = ($this, $theta, $indexes) => {
    oajqg_Gate__init_($this, 1, oaju_Constants_rotationZMatrix($theta), $rt_s(28), $indexes);
},
oajqg_Rz__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_Rz();
    oajqg_Rz__init_(var_2, var_0, var_1);
    return var_2;
},
ji_Serializable = $rt_classWithoutFields(0),
jl_Number = $rt_classWithoutFields(),
jl_Number__init_ = $this => {
    jl_Object__init_($this);
},
jl_Comparable = $rt_classWithoutFields(0);
function jl_Integer() {
    jl_Number.call(this);
    this.$value1 = 0;
}
let jl_Integer_TYPE = null,
jl_Integer_integerCache = null,
jl_Integer_$callClinit = () => {
    jl_Integer_$callClinit = $rt_eraseClinit(jl_Integer);
    jl_Integer__clinit_();
},
jl_Integer__init_ = ($this, $value) => {
    jl_Integer_$callClinit();
    jl_Number__init_($this);
    $this.$value1 = $value;
},
jl_Integer__init_0 = var_0 => {
    let var_1 = new jl_Integer();
    jl_Integer__init_(var_1, var_0);
    return var_1;
},
jl_Integer_toString0 = ($i, $radix) => {
    jl_Integer_$callClinit();
    if (!($radix >= 2 && $radix <= 36))
        $radix = 10;
    return ((jl_AbstractStringBuilder__init_3(20)).$append3($i, $radix)).$toString();
},
jl_Integer_hashCode0 = $value => {
    jl_Integer_$callClinit();
    return $value;
},
jl_Integer_toHexString = $i => {
    jl_Integer_$callClinit();
    return otci_IntegerUtil_toUnsignedLogRadixString($i, 4);
},
jl_Integer_toString = $i => {
    jl_Integer_$callClinit();
    return jl_Integer_toString0($i, 10);
},
jl_Integer_parseInt = ($s, $radix) => {
    jl_Integer_$callClinit();
    if ($s !== null)
        return jl_Integer_parseIntImpl($s, 0, jl_String_length($s), $radix);
    $rt_throw(jl_NumberFormatException__init_1($rt_s(33)));
},
jl_Integer_parseIntImpl = ($s, $beginIndex, $endIndex, $radix) => {
    let $negative, var$6, $value, $maxValue, var$9, $digit, var$11, var$12, var$13, var$14;
    jl_Integer_$callClinit();
    if ($beginIndex == $endIndex)
        $rt_throw(jl_NumberFormatException__init_1($rt_s(34)));
    if ($radix >= 2 && $radix <= 36) {
        a: {
            $negative = 0;
            switch ($s.$charAt($beginIndex)) {
                case 43:
                    var$6 = $beginIndex + 1 | 0;
                    break a;
                case 45:
                    $negative = 1;
                    var$6 = $beginIndex + 1 | 0;
                    break a;
                default:
            }
            var$6 = $beginIndex;
        }
        $value = 0;
        $maxValue = 1 + (2147483647 / $radix | 0) | 0;
        if (var$6 == $endIndex)
            $rt_throw(jl_NumberFormatException__init_());
        while (true) {
            if (var$6 >= $endIndex) {
                if ($negative)
                    $value =  -$value | 0;
                return $value;
            }
            var$9 = var$6 + 1 | 0;
            $digit = jl_Integer_decodeDigit($s.$charAt(var$6));
            if ($digit < 0) {
                var$11 = new jl_NumberFormatException;
                var$12 = jl_String_valueOf($s.$subSequence($beginIndex, $endIndex));
                var$13 = jl_StringBuilder__init_();
                jl_StringBuilder_append(jl_StringBuilder_append(var$13, $rt_s(35)), var$12);
                jl_NumberFormatException__init_0(var$11, jl_StringBuilder_toString(var$13));
                $rt_throw(var$11);
            }
            if ($digit >= $radix) {
                var$12 = new jl_NumberFormatException;
                var$13 = jl_String_valueOf($s.$subSequence($beginIndex, $endIndex));
                var$14 = jl_StringBuilder__init_();
                jl_StringBuilder_append(jl_StringBuilder_append(jl_StringBuilder_append1(jl_StringBuilder_append(var$14, $rt_s(36)), $radix), $rt_s(37)), var$13);
                jl_NumberFormatException__init_0(var$12, jl_StringBuilder_toString(var$14));
                $rt_throw(var$12);
            }
            if ($value > $maxValue)
                break;
            $value = $rt_imul($radix, $value) + $digit | 0;
            if ($value < 0) {
                if (var$9 == $endIndex && $value == (-2147483648) && $negative)
                    return (-2147483648);
                var$11 = new jl_NumberFormatException;
                var$12 = jl_String_valueOf($s.$subSequence($beginIndex, $endIndex));
                var$13 = jl_StringBuilder__init_();
                jl_StringBuilder_append(jl_StringBuilder_append(var$13, $rt_s(38)), var$12);
                jl_NumberFormatException__init_0(var$11, jl_StringBuilder_toString(var$13));
                $rt_throw(var$11);
            }
            var$6 = var$9;
        }
        $rt_throw(jl_NumberFormatException__init_1($rt_s(39)));
    }
    var$11 = new jl_NumberFormatException;
    var$12 = jl_StringBuilder__init_();
    jl_StringBuilder_append1(jl_StringBuilder_append(var$12, $rt_s(40)), $radix);
    jl_NumberFormatException__init_0(var$11, jl_StringBuilder_toString(var$12));
    $rt_throw(var$11);
},
jl_Integer_parseInt0 = $s => {
    jl_Integer_$callClinit();
    return jl_Integer_parseInt($s, 10);
},
jl_Integer_valueOf1 = ($s, $radix) => {
    jl_Integer_$callClinit();
    return jl_Integer_valueOf(jl_Integer_parseInt($s, $radix));
},
jl_Integer_valueOf0 = $s => {
    jl_Integer_$callClinit();
    return jl_Integer_valueOf1($s, 10);
},
jl_Integer_valueOf = $i => {
    jl_Integer_$callClinit();
    if ($i >= (-128) && $i <= 127) {
        jl_Integer_ensureIntegerCache();
        return jl_Integer_integerCache.data[$i + 128 | 0];
    }
    return jl_Integer__init_0($i);
},
jl_Integer_ensureIntegerCache = () => {
    let $j;
    jl_Integer_$callClinit();
    a: {
        if (jl_Integer_integerCache === null) {
            jl_Integer_integerCache = $rt_createArray(jl_Integer, 256);
            $j = 0;
            while (true) {
                if ($j >= jl_Integer_integerCache.data.length)
                    break a;
                jl_Integer_integerCache.data[$j] = jl_Integer__init_0($j - 128 | 0);
                $j = $j + 1 | 0;
            }
        }
    }
},
jl_Integer_intValue = $this => {
    return $this.$value1;
},
jl_Integer_toString1 = $this => {
    return jl_Integer_toString($this.$value1);
},
jl_Integer_hashCode = $this => {
    return jl_Integer_hashCode0($this.$value1);
},
jl_Integer_equals = ($this, $other) => {
    if ($this === $other)
        return 1;
    return $other instanceof jl_Integer && $other.$value1 == $this.$value1 ? 1 : 0;
},
jl_Integer_getInteger0 = ($nm, $val) => {
    jl_Integer_$callClinit();
    return jl_Integer_getInteger($nm, jl_Integer_valueOf($val));
},
jl_Integer_getInteger = ($nm, $val) => {
    let $result, $$je;
    jl_Integer_$callClinit();
    $result = $nm === null ? null : jl_System_getProperty(jl_String_toString($nm));
    a: {
        try {
            if ($result !== null)
                $val = jl_Integer_valueOf0($result);
        } catch ($$e) {
            $$je = $rt_wrapException($$e);
            if ($$je instanceof jl_NumberFormatException) {
                break a;
            } else {
                throw $$e;
            }
        }
        return $val;
    }
    return null;
},
jl_Integer_decodeDigit = $c => {
    jl_Integer_$callClinit();
    if ($c >= 48 && $c <= 57)
        return $c - 48 | 0;
    if ($c >= 97 && $c <= 122)
        return ($c - 97 | 0) + 10 | 0;
    if ($c >= 65 && $c <= 90)
        return ($c - 65 | 0) + 10 | 0;
    return (-1);
},
jl_Integer_numberOfLeadingZeros = $i => {
    let $n, var$3, var$4;
    jl_Integer_$callClinit();
    if (!$i)
        return 32;
    $n = 0;
    var$3 = $i >>> 16 | 0;
    if (var$3)
        $n = 16;
    else
        var$3 = $i;
    var$4 = var$3 >>> 8 | 0;
    if (!var$4)
        var$4 = var$3;
    else
        $n = $n | 8;
    var$3 = var$4 >>> 4 | 0;
    if (!var$3)
        var$3 = var$4;
    else
        $n = $n | 4;
    var$4 = var$3 >>> 2 | 0;
    if (!var$4)
        var$4 = var$3;
    else
        $n = $n | 2;
    if (var$4 >>> 1 | 0)
        $n = $n | 1;
    return (32 - $n | 0) - 1 | 0;
},
jl_Integer_numberOfTrailingZeros = $i => {
    let $n, var$3, var$4;
    jl_Integer_$callClinit();
    if (!$i)
        return 32;
    $n = 0;
    var$3 = $i << 16;
    if (var$3)
        $n = 16;
    else
        var$3 = $i;
    var$4 = var$3 << 8;
    if (!var$4)
        var$4 = var$3;
    else
        $n = $n | 8;
    var$3 = var$4 << 4;
    if (!var$3)
        var$3 = var$4;
    else
        $n = $n | 4;
    var$4 = var$3 << 2;
    if (!var$4)
        var$4 = var$3;
    else
        $n = $n | 2;
    if (var$4 << 1)
        $n = $n | 1;
    return (32 - $n | 0) - 1 | 0;
},
jl_Integer_signum = $i => {
    jl_Integer_$callClinit();
    return $i >> 31 | (( -$i | 0) >>> 31 | 0);
},
jl_Integer__clinit_ = () => {
    jl_Integer_TYPE = $rt_cls($rt_intcls);
},
oajqg_Ry = $rt_classWithoutFields(oajqg_Gate),
oajqg_Ry__init_ = ($this, $theta, $indexes) => {
    oajqg_Gate__init_($this, 1, oaju_Constants_rotationYMatrix($theta), $rt_s(27), $indexes);
},
oajqg_Ry__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_Ry();
    oajqg_Ry__init_(var_2, var_0, var_1);
    return var_2;
};
function oajvs_GateSpec() {
    let a = this; jl_Record.call(a);
    a.$kind0 = null;
    a.$targets0 = null;
    a.$controls0 = null;
    a.$params0 = null;
    a.$matrix0 = null;
}
let oajvs_GateSpec__init_ = ($this, $kind, $targets, $controls, $params, $matrix) => {
    let var$6, var$7, var$8, var$9;
    jl_Record__init_($this);
    var$6 = ju_List_copyOf($targets);
    var$7 = ju_List_copyOf($controls);
    var$8 = ju_Map_copyOf($params);
    var$9 = $matrix === null ? null : (($matrix.$stream()).$map(oajvs_GateSpec$_init_$lambda$_0_0__init_0())).$toList();
    $this.$kind0 = $kind;
    $this.$targets0 = var$6;
    $this.$controls0 = var$7;
    $this.$params0 = var$8;
    $this.$matrix0 = var$9;
},
oajvs_GateSpec__init_0 = (var_0, var_1, var_2, var_3, var_4) => {
    let var_5 = new oajvs_GateSpec();
    oajvs_GateSpec__init_(var_5, var_0, var_1, var_2, var_3, var_4);
    return var_5;
},
oajvs_GateSpec_toString = $this => {
    return ((((((((((((jl_StringBuilder__init_0($rt_s(41))).$append1($rt_s(42))).$append($this.$kind0)).$append1($rt_s(43))).$append($this.$targets0)).$append1($rt_s(44))).$append($this.$controls0)).$append1($rt_s(45))).$append($this.$params0)).$append1($rt_s(46))).$append($this.$matrix0)).$append1($rt_s(47))).$toString();
},
oajvs_GateSpec_hashCode = $this => {
    return ((((((((31 + ju_Objects_hashCode($this.$kind0) | 0) * 31 | 0) + ju_Objects_hashCode($this.$targets0) | 0) * 31 | 0) + ju_Objects_hashCode($this.$controls0) | 0) * 31 | 0) + ju_Objects_hashCode($this.$params0) | 0) * 31 | 0) + ju_Objects_hashCode($this.$matrix0) | 0;
},
oajvs_GateSpec_equals = ($this, $o) => {
    let var$2, var$3;
    if ($this === $o)
        var$2 = 1;
    else if ($o !== null && jl_Object_getClass($o) === $rt_cls(oajvs_GateSpec)) {
        var$3 = $o;
        var$2 = !ju_Objects_equals($this.$kind0, var$3.$kind0) ? 0 : !ju_Objects_equals($this.$targets0, var$3.$targets0) ? 0 : !ju_Objects_equals($this.$controls0, var$3.$controls0) ? 0 : !ju_Objects_equals($this.$params0, var$3.$params0) ? 0 : ju_Objects_equals($this.$matrix0, var$3.$matrix0) ? 1 : 0;
    } else
        var$2 = 0;
    return var$2;
},
oajvs_GateSpec_kind = $this => {
    return $this.$kind0;
},
oajvs_GateSpec_targets = $this => {
    return $this.$targets0;
},
oajvs_GateSpec_controls = $this => {
    return $this.$controls0;
},
oajvs_GateSpec_params = $this => {
    return $this.$params0;
},
oajvs_GateSpec_matrix = $this => {
    return $this.$matrix0;
},
oajqg_Rx = $rt_classWithoutFields(oajqg_Gate),
oajqg_Rx__init_ = ($this, $theta, $indexes) => {
    oajqg_Gate__init_($this, 1, oaju_Constants_rotationXMatrix($theta), $rt_s(26), $indexes);
},
oajqg_Rx__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_Rx();
    oajqg_Rx__init_(var_2, var_0, var_1);
    return var_2;
},
jl_CloneNotSupportedException = $rt_classWithoutFields(jl_Exception),
jl_CloneNotSupportedException__init_ = $this => {
    jl_Exception__init_($this);
},
jl_CloneNotSupportedException__init_0 = () => {
    let var_0 = new jl_CloneNotSupportedException();
    jl_CloneNotSupportedException__init_(var_0);
    return var_0;
},
juf_IntPredicate = $rt_classWithoutFields(0);
function oajq_Circuit$initializeLevels$lambda$_8_1() {
    jl_Object.call(this);
    this.$_01 = null;
}
let oajq_Circuit$initializeLevels$lambda$_8_1__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_01 = var$1;
},
oajq_Circuit$initializeLevels$lambda$_8_1__init_0 = var_0 => {
    let var_1 = new oajq_Circuit$initializeLevels$lambda$_8_1();
    oajq_Circuit$initializeLevels$lambda$_8_1__init_(var_1, var_0);
    return var_1;
},
oajq_Circuit$initializeLevels$lambda$_8_1_test = (var$0, var$1) => {
    return oajq_Circuit_lambda$initializeLevels$2(var$0.$_01, var$1);
},
juf_Predicate = $rt_classWithoutFields(0);
function oajq_Circuit$initializeLevels$lambda$_8_0() {
    jl_Object.call(this);
    this.$_08 = null;
}
let oajq_Circuit$initializeLevels$lambda$_8_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_08 = var$1;
},
oajq_Circuit$initializeLevels$lambda$_8_0__init_0 = var_0 => {
    let var_1 = new oajq_Circuit$initializeLevels$lambda$_8_0();
    oajq_Circuit$initializeLevels$lambda$_8_0__init_(var_1, var_0);
    return var_1;
},
oajq_Circuit$initializeLevels$lambda$_8_0_test0 = (var$0, var$1) => {
    return oajq_Circuit$initializeLevels$lambda$_8_0_test(var$0, var$1);
},
oajq_Circuit$initializeLevels$lambda$_8_0_test = (var$0, var$1) => {
    return oajq_Circuit_lambda$initializeLevels$0(var$0.$_08, var$1);
},
oaju_Constants = $rt_classWithoutFields(),
oaju_Constants_HALF_VALUE = 0.0,
oaju_Constants_HALF_COMPLEX = null,
oaju_Constants_HALF_NEGATIVE_COMPLEX = null,
oaju_Constants_CONTROLLED_NOT_MATRIX = null,
oaju_Constants_CONTROLLED_Z_MATRIX = null,
oaju_Constants_CONTROLLED_Y_MATRIX = null,
oaju_Constants_SWAP_MATRIX = null,
oaju_Constants_TOFFOLI_MATRIX = null,
oaju_Constants_CONTROLLED_SWAP_MATRIX = null,
oaju_Constants_HADAMARD_MATRIX = null,
oaju_Constants_PAULI_S_MATRIX = null,
oaju_Constants_PAULI_T_MATRIX = null,
oaju_Constants_PAULI_X_MATRIX = null,
oaju_Constants_PAULI_Y_MATRIX = null,
oaju_Constants_PAULI_Z_MATRIX = null,
oaju_Constants_$callClinit = () => {
    oaju_Constants_$callClinit = $rt_eraseClinit(oaju_Constants);
    oaju_Constants__clinit_();
},
oaju_Constants_rotationXMatrix = $theta => {
    let var$2, $c, $s, $diag, $offDiag, var$7, var$8;
    oaju_Constants_$callClinit();
    var$2 = $theta / 2.0;
    $c = jl_Math_cos(var$2);
    $s = jl_Math_sin(var$2);
    $diag = oajm_Complex__init_($c, 0.0);
    $offDiag = oajm_Complex__init_(0.0,  -$s);
    var$7 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$8 = var$7.data;
    var$8[0] = $rt_wrapArray(oajm_Complex, [$diag, $offDiag]);
    var$8[1] = $rt_wrapArray(oajm_Complex, [$offDiag, $diag]);
    return oajm_ComplexMatrix_createMatrixWithData(var$7);
},
oaju_Constants_rotationYMatrix = $theta => {
    let var$2, $c, $s, var$5, var$6, var$7, var$8;
    oaju_Constants_$callClinit();
    var$2 = $theta / 2.0;
    $c = jl_Math_cos(var$2);
    $s = jl_Math_sin(var$2);
    var$5 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$6 = var$5.data;
    var$7 = $rt_createArray(oajm_Complex, 2);
    var$8 = var$7.data;
    var$8[0] = oajm_Complex__init_($c, 0.0);
    var$8[1] = oajm_Complex__init_( -$s, 0.0);
    var$6[0] = var$7;
    var$8 = $rt_createArray(oajm_Complex, 2);
    var$7 = var$8.data;
    var$7[0] = oajm_Complex__init_($s, 0.0);
    var$7[1] = oajm_Complex__init_($c, 0.0);
    var$6[1] = var$8;
    return oajm_ComplexMatrix_createMatrixWithData(var$5);
},
oaju_Constants_rotationZMatrix = $theta => {
    let var$2, var$3, var$4, var$5, var$6;
    oaju_Constants_$callClinit();
    var$2 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$3 = var$2.data;
    var$4 = $rt_createArray(oajm_Complex, 2);
    var$5 = var$4.data;
    var$6 =  -$theta / 2.0;
    var$5[0] = oajm_Complex_expI(var$6);
    var$5[1] = oajm_Complex_ZERO;
    var$3[0] = var$4;
    var$5 = $rt_createArray(oajm_Complex, 2);
    var$4 = var$5.data;
    var$4[0] = oajm_Complex_ZERO;
    var$6 = $theta / 2.0;
    var$4[1] = oajm_Complex_expI(var$6);
    var$3[1] = var$5;
    return oajm_ComplexMatrix_createMatrixWithData(var$2);
},
oaju_Constants_phaseMatrix = $theta => {
    let var$2, var$3, var$4, var$5;
    oaju_Constants_$callClinit();
    var$2 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$3 = var$2.data;
    var$4 = $rt_createArray(oajm_Complex, 2);
    var$5 = var$4.data;
    oajm_Complex_$callClinit();
    var$5[0] = oajm_Complex_ONE;
    var$5[1] = oajm_Complex_ZERO;
    var$3[0] = var$4;
    var$4 = $rt_createArray(oajm_Complex, 2);
    var$5 = var$4.data;
    var$5[0] = oajm_Complex_ZERO;
    var$5[1] = oajm_Complex_expI($theta);
    var$3[1] = var$4;
    return oajm_ComplexMatrix_createMatrixWithData(var$2);
},
oaju_Constants_u3Matrix = ($theta, $phi, $lambda) => {
    let var$4, $c, $s, $m00, $m01, $m10, $m11, var$11, var$12;
    oaju_Constants_$callClinit();
    var$4 = $theta / 2.0;
    $c = jl_Math_cos(var$4);
    $s = jl_Math_sin(var$4);
    $m00 = oajm_Complex__init_($c, 0.0);
    $m01 = oajm_Complex_multiply(oajm_Complex_expI($lambda),  -$s);
    $m10 = oajm_Complex_multiply(oajm_Complex_expI($phi), $s);
    $m11 = oajm_Complex_multiply(oajm_Complex_expI($phi + $lambda), $c);
    var$11 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$12 = var$11.data;
    var$12[0] = $rt_wrapArray(oajm_Complex, [$m00, $m01]);
    var$12[1] = $rt_wrapArray(oajm_Complex, [$m10, $m11]);
    return oajm_ComplexMatrix_createMatrixWithData(var$11);
},
oaju_Constants__clinit_ = () => {
    let var$1, var$2, var$3, var$4, var$5;
    oaju_Constants_HALF_VALUE = 1.0 / jl_Math_sqrt(2.0);
    oaju_Constants_HALF_COMPLEX = oajm_Complex__init_(oaju_Constants_HALF_VALUE, 0.0);
    oaju_Constants_HALF_NEGATIVE_COMPLEX = oajm_Complex__init_( -oaju_Constants_HALF_VALUE, 0.0);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 4);
    var$2 = var$1.data;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ONE;
    var$4[1] = oajm_Complex_ZERO;
    var$4[2] = oajm_Complex_ZERO;
    var$4[3] = oajm_Complex_ZERO;
    var$2[0] = var$3;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ZERO;
    var$4[1] = oajm_Complex_ONE;
    var$4[2] = oajm_Complex_ZERO;
    var$4[3] = oajm_Complex_ZERO;
    var$2[1] = var$3;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ZERO;
    var$4[1] = oajm_Complex_ZERO;
    var$4[2] = oajm_Complex_ZERO;
    var$4[3] = oajm_Complex_ONE;
    var$2[2] = var$3;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ZERO;
    var$4[1] = oajm_Complex_ZERO;
    var$4[2] = oajm_Complex_ONE;
    var$4[3] = oajm_Complex_ZERO;
    var$2[3] = var$3;
    oaju_Constants_CONTROLLED_NOT_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 4);
    var$2 = var$1.data;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ONE;
    var$4[1] = oajm_Complex_ZERO;
    var$4[2] = oajm_Complex_ZERO;
    var$4[3] = oajm_Complex_ZERO;
    var$2[0] = var$3;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ZERO;
    var$4[1] = oajm_Complex_ONE;
    var$4[2] = oajm_Complex_ZERO;
    var$4[3] = oajm_Complex_ZERO;
    var$2[1] = var$3;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ZERO;
    var$4[1] = oajm_Complex_ZERO;
    var$4[2] = oajm_Complex_ONE;
    var$4[3] = oajm_Complex_ZERO;
    var$2[2] = var$3;
    var$3 = $rt_createArray(oajm_Complex, 4);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ZERO;
    var$4[1] = oajm_Complex_ZERO;
    var$4[2] = oajm_Complex_ZERO;
    var$5 = oajm_Complex_ONE;
    var$4[3] = oajm_Complex_multiply(var$5, (-1.0));
    var$2[3] = var$3;
    oaju_Constants_CONTROLLED_Z_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 4);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ONE;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$4[1] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$5 = oajm_Complex_I;
    var$3[3] = oajm_Complex_multiply(var$5, (-1.0));
    var$4[2] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_I;
    var$3[3] = oajm_Complex_ZERO;
    var$4[3] = var$2;
    oaju_Constants_CONTROLLED_Y_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 4);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ONE;
    var$3[3] = oajm_Complex_ZERO;
    var$4[1] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ONE;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$4[2] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 4);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ONE;
    var$4[3] = var$2;
    oaju_Constants_SWAP_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 8);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ONE;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[1] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ONE;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[2] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ONE;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[3] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ONE;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[4] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ONE;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[5] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ONE;
    var$4[6] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ONE;
    var$3[7] = oajm_Complex_ZERO;
    var$4[7] = var$2;
    oaju_Constants_TOFFOLI_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 8);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ONE;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[1] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ONE;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[2] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ONE;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[3] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ONE;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[4] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ONE;
    var$3[7] = oajm_Complex_ZERO;
    var$4[5] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ONE;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ZERO;
    var$4[6] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 8);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ZERO;
    var$3[2] = oajm_Complex_ZERO;
    var$3[3] = oajm_Complex_ZERO;
    var$3[4] = oajm_Complex_ZERO;
    var$3[5] = oajm_Complex_ZERO;
    var$3[6] = oajm_Complex_ZERO;
    var$3[7] = oajm_Complex_ONE;
    var$4[7] = var$2;
    oaju_Constants_CONTROLLED_SWAP_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oaju_Constants_HALF_COMPLEX;
    var$3[1] = oaju_Constants_HALF_COMPLEX;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oaju_Constants_HALF_COMPLEX;
    var$3[1] = oaju_Constants_HALF_NEGATIVE_COMPLEX;
    var$4[1] = var$2;
    oaju_Constants_HADAMARD_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_ZERO;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_I;
    var$4[1] = var$2;
    oaju_Constants_PAULI_S_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$2 = var$1.data;
    var$3 = $rt_createArray(oajm_Complex, 2);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ONE;
    var$4[1] = oajm_Complex_ZERO;
    var$2[0] = var$3;
    var$3 = $rt_createArray(oajm_Complex, 2);
    var$4 = var$3.data;
    var$4[0] = oajm_Complex_ZERO;
    var$5 = oajm_Complex__init_(jl_Math_cos(0.7853981633974483), jl_Math_sin(0.7853981633974483));
    var$4[1] = var$5;
    var$2[1] = var$3;
    oaju_Constants_PAULI_T_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$3[1] = oajm_Complex_ONE;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_ZERO;
    var$4[1] = var$2;
    oaju_Constants_PAULI_X_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$5 = oajm_Complex_I;
    var$3[1] = oajm_Complex_multiply(var$5, (-1.0));
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_I;
    var$3[1] = oajm_Complex_ZERO;
    var$4[1] = var$2;
    oaju_Constants_PAULI_Y_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
    var$1 = $rt_createArray($rt_arraycls(oajm_Complex), 2);
    var$4 = var$1.data;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_ZERO;
    var$4[0] = var$2;
    var$2 = $rt_createArray(oajm_Complex, 2);
    var$3 = var$2.data;
    var$3[0] = oajm_Complex_ZERO;
    var$5 = oajm_Complex_ONE;
    var$3[1] = oajm_Complex_multiply(var$5, (-1.0));
    var$4[1] = var$2;
    oaju_Constants_PAULI_Z_MATRIX = oajm_ComplexMatrix_createMatrixWithData(var$1);
},
jl_AbstractStringBuilder$Constants = $rt_classWithoutFields(),
jl_AbstractStringBuilder$Constants_longLogPowersOfTen = null,
jl_AbstractStringBuilder$Constants_doubleAnalysisResult = null,
jl_AbstractStringBuilder$Constants_floatAnalysisResult = null,
jl_AbstractStringBuilder$Constants_$callClinit = () => {
    jl_AbstractStringBuilder$Constants_$callClinit = $rt_eraseClinit(jl_AbstractStringBuilder$Constants);
    jl_AbstractStringBuilder$Constants__clinit_();
},
jl_AbstractStringBuilder$Constants__clinit_ = () => {
    jl_AbstractStringBuilder$Constants_longLogPowersOfTen = $rt_createLongArrayFromData([Long_fromInt(1), Long_fromInt(10), Long_fromInt(100), Long_fromInt(10000), Long_fromInt(100000000), Long_create(1874919424, 2328306)]);
    jl_AbstractStringBuilder$Constants_doubleAnalysisResult = otcit_DoubleAnalyzer$Result__init_();
    jl_AbstractStringBuilder$Constants_floatAnalysisResult = otcit_FloatAnalyzer$Result__init_0();
},
jm_BigDecimal$1 = $rt_classWithoutFields(),
jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode = null,
jm_BigDecimal$1_$callClinit = () => {
    jm_BigDecimal$1_$callClinit = $rt_eraseClinit(jm_BigDecimal$1);
    jm_BigDecimal$1__clinit_();
},
jm_BigDecimal$1__clinit_ = () => {
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode = $rt_createIntArray((jm_RoundingMode_values()).data.length);
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_UNNECESSARY)] = 1;
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_UP)] = 2;
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_DOWN)] = 3;
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_CEILING)] = 4;
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_FLOOR)] = 5;
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_HALF_UP)] = 6;
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_HALF_DOWN)] = 7;
    jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal(jm_RoundingMode_HALF_EVEN)] = 8;
},
jl_Long = $rt_classWithoutFields(jl_Number),
jl_Long_TYPE = null,
jl_Long_$callClinit = () => {
    jl_Long_$callClinit = $rt_eraseClinit(jl_Long);
    jl_Long__clinit_();
},
jl_Long_parseLong0 = ($s, $radix) => {
    jl_Long_$callClinit();
    if ($s !== null)
        return jl_Long_parseLongImpl($s, 0, jl_String_length($s), $radix);
    $rt_throw(jl_NumberFormatException__init_1($rt_s(33)));
},
jl_Long_parseLongImpl = ($s, $beginIndex, $endIndex, $radix) => {
    let $negative, var$6, $value, var$8, $maxValue, var$10, $digit, var$12, var$13, var$14, var$15;
    jl_Long_$callClinit();
    if ($radix >= 2 && $radix <= 36) {
        if ($beginIndex == $endIndex)
            $rt_throw(jl_NumberFormatException__init_1($rt_s(34)));
        a: {
            $negative = 0;
            switch ($s.$charAt($beginIndex)) {
                case 43:
                    var$6 = $beginIndex + 1 | 0;
                    break a;
                case 45:
                    $negative = 1;
                    var$6 = $beginIndex + 1 | 0;
                    break a;
                default:
            }
            var$6 = $beginIndex;
        }
        $value = Long_ZERO;
        var$8 = Long_fromInt($radix);
        $maxValue = Long_add(Long_fromInt(1), Long_div(Long_create(4294967295, 2147483647), var$8));
        if (var$6 == $endIndex)
            $rt_throw(jl_NumberFormatException__init_());
        while (true) {
            if (var$6 >= $endIndex) {
                if ($negative)
                    $value = Long_neg($value);
                return $value;
            }
            var$10 = var$6 + 1 | 0;
            $digit = jl_Long_decodeDigit($s.$charAt(var$6));
            if ($digit < 0) {
                var$12 = new jl_NumberFormatException;
                var$13 = jl_String_valueOf($s.$subSequence($beginIndex, $endIndex));
                var$14 = jl_StringBuilder__init_();
                jl_StringBuilder_append(jl_StringBuilder_append(var$14, $rt_s(35)), var$13);
                jl_NumberFormatException__init_0(var$12, jl_StringBuilder_toString(var$14));
                $rt_throw(var$12);
            }
            if ($digit >= $radix) {
                var$14 = new jl_NumberFormatException;
                var$15 = jl_String_valueOf($s.$subSequence($beginIndex, $endIndex));
                var$12 = jl_StringBuilder__init_();
                jl_StringBuilder_append(jl_StringBuilder_append(jl_StringBuilder_append1(jl_StringBuilder_append(var$12, $rt_s(36)), $radix), $rt_s(37)), var$15);
                jl_NumberFormatException__init_0(var$14, jl_StringBuilder_toString(var$12));
                $rt_throw(var$14);
            }
            if (Long_gt($value, $maxValue))
                break;
            $value = Long_add(Long_mul(var$8, $value), Long_fromInt($digit));
            if (Long_lt($value, Long_ZERO)) {
                if (var$10 == $endIndex && Long_eq($value, Long_create(0, 2147483648)) && $negative)
                    return Long_create(0, 2147483648);
                var$12 = new jl_NumberFormatException;
                var$13 = jl_String_valueOf($s.$subSequence($beginIndex, $endIndex));
                var$14 = jl_StringBuilder__init_();
                jl_StringBuilder_append(jl_StringBuilder_append(var$14, $rt_s(48)), var$13);
                jl_NumberFormatException__init_0(var$12, jl_StringBuilder_toString(var$14));
                $rt_throw(var$12);
            }
            var$6 = var$10;
        }
        $rt_throw(jl_NumberFormatException__init_1($rt_s(49)));
    }
    var$13 = new jl_NumberFormatException;
    var$14 = jl_StringBuilder__init_();
    jl_StringBuilder_append1(jl_StringBuilder_append(var$14, $rt_s(40)), $radix);
    jl_NumberFormatException__init_0(var$13, jl_StringBuilder_toString(var$14));
    $rt_throw(var$13);
},
jl_Long_parseLong = $s => {
    jl_Long_$callClinit();
    return jl_Long_parseLong0($s, 10);
},
jl_Long_decodeDigit = $c => {
    jl_Long_$callClinit();
    if ($c >= 48 && $c <= 57)
        return $c - 48 | 0;
    if ($c >= 97 && $c <= 122)
        return ($c - 97 | 0) + 10 | 0;
    if ($c >= 65 && $c <= 90)
        return ($c - 65 | 0) + 10 | 0;
    return (-1);
},
jl_Long_numberOfLeadingZeros = $i => {
    let $n, var$3, var$4;
    jl_Long_$callClinit();
    if (Long_eq($i, Long_ZERO))
        return 64;
    $n = 0;
    var$3 = Long_shru($i, 32);
    if (Long_ne(var$3, Long_ZERO))
        $n = 32;
    else
        var$3 = $i;
    var$4 = Long_shru(var$3, 16);
    if (Long_eq(var$4, Long_ZERO))
        var$4 = var$3;
    else
        $n = $n | 16;
    var$3 = Long_shru(var$4, 8);
    if (Long_eq(var$3, Long_ZERO))
        var$3 = var$4;
    else
        $n = $n | 8;
    var$4 = Long_shru(var$3, 4);
    if (Long_eq(var$4, Long_ZERO))
        var$4 = var$3;
    else
        $n = $n | 4;
    var$3 = Long_shru(var$4, 2);
    if (Long_eq(var$3, Long_ZERO))
        var$3 = var$4;
    else
        $n = $n | 2;
    if (Long_ne(Long_shru(var$3, 1), Long_ZERO))
        $n = $n | 1;
    return (64 - $n | 0) - 1 | 0;
},
jl_Long_signum = $i => {
    jl_Long_$callClinit();
    return Long_lo(Long_or(Long_shr($i, 63), Long_shru(Long_neg($i), 63)));
},
jl_Long_divideUnsigned = (var$1, var$2) => {
    return Long_udiv(var$1, var$2);
},
jl_Long_compareUnsigned = (var$1, var$2) => {
    return Long_ucompare(var$1, var$2);
},
jl_Long__clinit_ = () => {
    jl_Long_TYPE = $rt_cls($rt_longcls);
},
juf_Supplier = $rt_classWithoutFields(0);
let jus_Collectors$toList$lambda$_2_0 = $rt_classWithoutFields(),
jus_Collectors$toList$lambda$_2_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jus_Collectors$toList$lambda$_2_0__init_0 = () => {
    let var_0 = new jus_Collectors$toList$lambda$_2_0();
    jus_Collectors$toList$lambda$_2_0__init_(var_0);
    return var_0;
},
jus_Collectors$toList$lambda$_2_0_get0 = var$0 => {
    return jus_Collectors$toList$lambda$_2_0_get(var$0);
},
jus_Collectors$toList$lambda$_2_0_get = var$0 => {
    return ju_ArrayList__init_();
},
ju_Map = $rt_classWithoutFields(0),
ju_Map_of = () => {
    return ju_Collections_emptyMap();
},
ju_Map_ofEntries = $entries => {
    return ju_TemplateCollections$NEtriesMap__init_2($entries);
},
ju_Map_entry = ($k, $v) => {
    return ju_TemplateCollections$ImmutableEntry__init_0(ju_Objects_requireNonNull0($k), ju_Objects_requireNonNull0($v));
},
ju_Map_copyOf = $map => {
    if ($map instanceof ju_TemplateCollections$NEtriesMap)
        return $map;
    return ju_TemplateCollections$NEtriesMap__init_1($map);
},
jl_Runnable = $rt_classWithoutFields(0);
function jl_Thread() {
    let a = this; jl_Object.call(a);
    a.$id = Long_ZERO;
    a.$timeSliceStart = Long_ZERO;
    a.$finishedLock = null;
    a.$name3 = null;
    a.$alive = 0;
    a.$target = null;
}
let jl_Thread_mainThread = null,
jl_Thread_currentThread0 = null,
jl_Thread_nextId = 0,
jl_Thread_activeCount = 0,
jl_Thread_defaultUncaughtExceptionHandler = null,
jl_Thread_$callClinit = () => {
    jl_Thread_$callClinit = $rt_eraseClinit(jl_Thread);
    jl_Thread__clinit_();
},
jl_Thread__init_0 = ($this, $name) => {
    jl_Thread_$callClinit();
    jl_Thread__init_($this, null, $name);
},
jl_Thread__init_1 = var_0 => {
    let var_1 = new jl_Thread();
    jl_Thread__init_0(var_1, var_0);
    return var_1;
},
jl_Thread__init_ = ($this, $target, $name) => {
    let var$3;
    jl_Thread_$callClinit();
    jl_Object__init_($this);
    $this.$finishedLock = jl_Object__init_0();
    $this.$alive = 1;
    $this.$name3 = $name;
    $this.$target = $target;
    var$3 = jl_Thread_nextId;
    jl_Thread_nextId = var$3 + 1 | 0;
    $this.$id = Long_fromInt(var$3);
},
jl_Thread__init_2 = (var_0, var_1) => {
    let var_2 = new jl_Thread();
    jl_Thread__init_(var_2, var_0, var_1);
    return var_2;
},
jl_Thread_setCurrentThread = $thread_0 => {
    jl_Thread_$callClinit();
    if (jl_Thread_currentThread0 !== $thread_0)
        jl_Thread_currentThread0 = $thread_0;
    jl_Thread_currentThread0.$timeSliceStart = jl_System_currentTimeMillis();
},
jl_Thread_currentThread = () => {
    jl_Thread_$callClinit();
    return jl_Thread_currentThread0;
},
jl_Thread__clinit_ = () => {
    jl_Thread_mainThread = jl_Thread__init_1($rt_s(50));
    jl_Thread_currentThread0 = jl_Thread_mainThread;
    jl_Thread_nextId = 1;
    jl_Thread_activeCount = 1;
    jl_Thread_defaultUncaughtExceptionHandler = jl_DefaultUncaughtExceptionHandler__init_0();
};
function oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0() {
    jl_Object.call(this);
    this.$_010 = null;
}
let oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_010 = var$1;
},
oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0__init_0 = var_0 => {
    let var_1 = new oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0();
    oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0__init_(var_1, var_0);
    return var_1;
},
oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0_test0 = (var$0, var$1) => {
    return oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0_test(var$0, var$1);
},
oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0_test = (var$0, var$1) => {
    return oajq_Circuit_lambda$initializeLevels$1(var$0.$_010, var$1);
};
function jm_BigInteger() {
    let a = this; jl_Number.call(a);
    a.$digits = null;
    a.$numberLength = 0;
    a.$sign0 = 0;
    a.$firstNonzeroDigit = 0;
}
let jm_BigInteger_ZERO = null,
jm_BigInteger_ONE = null,
jm_BigInteger_TWO = null,
jm_BigInteger_TEN = null,
jm_BigInteger_MINUS_ONE = null,
jm_BigInteger_SMALL_VALUES = null,
jm_BigInteger_TWO_POWS = null,
jm_BigInteger_$callClinit = () => {
    jm_BigInteger_$callClinit = $rt_eraseClinit(jm_BigInteger);
    jm_BigInteger__clinit_();
},
jm_BigInteger__init_4 = ($this, $val) => {
    jm_BigInteger_$callClinit();
    jm_BigInteger__init_1($this, $val, 10);
},
jm_BigInteger__init_9 = var_0 => {
    let var_1 = new jm_BigInteger();
    jm_BigInteger__init_4(var_1, var_0);
    return var_1;
},
jm_BigInteger__init_1 = ($this, $val, $radix) => {
    jm_BigInteger_$callClinit();
    jl_Number__init_($this);
    $this.$firstNonzeroDigit = (-2);
    if ($val === null)
        $rt_throw(jl_NullPointerException__init_());
    if ($radix >= 2 && $radix <= 36) {
        if (jl_String_length($val)) {
            jm_BigInteger_setFromString($this, $val, $radix);
            return;
        }
        $rt_throw(jl_NumberFormatException__init_1($rt_s(51)));
    }
    $rt_throw(jl_NumberFormatException__init_1($rt_s(52)));
},
jm_BigInteger__init_10 = (var_0, var_1) => {
    let var_2 = new jm_BigInteger();
    jm_BigInteger__init_1(var_2, var_0, var_1);
    return var_2;
},
jm_BigInteger__init_3 = ($this, $sign, $value) => {
    let var$3;
    jm_BigInteger_$callClinit();
    jl_Number__init_($this);
    $this.$firstNonzeroDigit = (-2);
    $this.$sign0 = $sign;
    $this.$numberLength = 1;
    var$3 = $rt_createIntArray(1);
    var$3.data[0] = $value;
    $this.$digits = var$3;
},
jm_BigInteger__init_0 = (var_0, var_1) => {
    let var_2 = new jm_BigInteger();
    jm_BigInteger__init_3(var_2, var_0, var_1);
    return var_2;
},
jm_BigInteger__init_5 = ($this, $sign, $numberLength, $digits) => {
    jm_BigInteger_$callClinit();
    jl_Number__init_($this);
    $this.$firstNonzeroDigit = (-2);
    $this.$sign0 = $sign;
    $this.$numberLength = $numberLength;
    $this.$digits = $digits;
},
jm_BigInteger__init_ = (var_0, var_1, var_2) => {
    let var_3 = new jm_BigInteger();
    jm_BigInteger__init_5(var_3, var_0, var_1, var_2);
    return var_3;
},
jm_BigInteger__init_2 = ($this, $sign, $val) => {
    let var$3;
    jm_BigInteger_$callClinit();
    jl_Number__init_($this);
    $this.$firstNonzeroDigit = (-2);
    $this.$sign0 = $sign;
    if (Long_eq(Long_and($val, Long_create(0, 4294967295)), Long_ZERO)) {
        $this.$numberLength = 1;
        var$3 = $rt_createIntArray(1);
        var$3.data[0] = Long_lo($val);
        $this.$digits = var$3;
    } else {
        $this.$numberLength = 2;
        $this.$digits = $rt_createIntArrayFromData([Long_lo($val), Long_hi($val)]);
    }
},
jm_BigInteger__init_6 = (var_0, var_1) => {
    let var_2 = new jm_BigInteger();
    jm_BigInteger__init_2(var_2, var_0, var_1);
    return var_2;
},
jm_BigInteger__init_7 = ($this, $signum, $digits) => {
    let var$3, var$4;
    jm_BigInteger_$callClinit();
    var$3 = $digits.data;
    jl_Number__init_($this);
    $this.$firstNonzeroDigit = (-2);
    var$4 = var$3.length;
    if (var$4) {
        $this.$sign0 = $signum;
        $this.$numberLength = var$4;
        $this.$digits = $digits;
        jm_BigInteger_cutOffLeadingZeroes($this);
    } else {
        $this.$sign0 = 0;
        $this.$numberLength = 1;
        var$3 = $rt_createIntArray(1);
        var$3.data[0] = 0;
        $this.$digits = var$3;
    }
},
jm_BigInteger__init_8 = (var_0, var_1) => {
    let var_2 = new jm_BigInteger();
    jm_BigInteger__init_7(var_2, var_0, var_1);
    return var_2;
},
jm_BigInteger_valueOf = $val => {
    jm_BigInteger_$callClinit();
    if (Long_lt($val, Long_ZERO)) {
        if (Long_eq($val, Long_fromInt(-1)))
            return jm_BigInteger_MINUS_ONE;
        return jm_BigInteger__init_6((-1), Long_neg($val));
    }
    if (Long_gt($val, Long_fromInt(10)))
        return jm_BigInteger__init_6(1, $val);
    return jm_BigInteger_SMALL_VALUES.data[Long_lo($val)];
},
jm_BigInteger_setFromString = ($bi, $val, $radix) => {
    let $stringLength, $sign, $substrStart, var$7, $charsPerInt, $bigRadixDigitsLength, $topChars, $digits, $bigRadix, $digitIndex, $substrStart_0, var$15, $bigRadixDigit, $newDigit, var$18;
    jm_BigInteger_$callClinit();
    $stringLength = jl_String_length($val);
    if (jl_String_charAt($val, 0) != 45) {
        $sign = 1;
        $substrStart = 0;
        var$7 = $stringLength;
    } else {
        $sign = (-1);
        $substrStart = 1;
        var$7 = $stringLength + (-1) | 0;
    }
    jm_Conversion_$callClinit();
    $charsPerInt = jm_Conversion_digitFitInInt.data[$radix];
    $bigRadixDigitsLength = var$7 / $charsPerInt | 0;
    $topChars = var$7 % $charsPerInt | 0;
    if ($topChars)
        $bigRadixDigitsLength = $bigRadixDigitsLength + 1 | 0;
    $digits = $rt_createIntArray($bigRadixDigitsLength);
    $bigRadix = jm_Conversion_bigRadices.data[$radix - 2 | 0];
    $digitIndex = 0;
    if (!$topChars)
        $topChars = $charsPerInt;
    $substrStart_0 = $substrStart + $topChars | 0;
    while ($substrStart < $stringLength) {
        var$15 = $digits.data;
        $bigRadixDigit = jl_Integer_parseInt(jl_String_substring($val, $substrStart, $substrStart_0), $radix);
        $newDigit = jm_Multiplication_multiplyByInt0($digits, $digitIndex, $bigRadix);
        var$18 = $newDigit + jm_Elementary_inplaceAdd($digits, $digitIndex, $bigRadixDigit) | 0;
        var$7 = $digitIndex + 1 | 0;
        var$15[$digitIndex] = var$18;
        var$18 = $substrStart_0 + $charsPerInt | 0;
        $digitIndex = var$7;
        $substrStart = $substrStart_0;
        $substrStart_0 = var$18;
    }
    $bi.$sign0 = $sign;
    $bi.$numberLength = $digitIndex;
    $bi.$digits = $digits;
    jm_BigInteger_cutOffLeadingZeroes($bi);
},
jm_BigInteger_abs = $this => {
    if ($this.$sign0 < 0)
        $this = jm_BigInteger__init_(1, $this.$numberLength, $this.$digits);
    return $this;
},
jm_BigInteger_negate = $this => {
    return !$this.$sign0 ? $this : jm_BigInteger__init_( -$this.$sign0 | 0, $this.$numberLength, $this.$digits);
},
jm_BigInteger_add = ($this, $val) => {
    return jm_Elementary_add1($this, $val);
},
jm_BigInteger_subtract = ($this, $val) => {
    return jm_Elementary_subtract0($this, $val);
},
jm_BigInteger_signum = $this => {
    return $this.$sign0;
},
jm_BigInteger_shiftRight = ($this, $n) => {
    if ($n && $this.$sign0)
        return $n > 0 ? jm_BitLevel_shiftRight($this, $n) : jm_BitLevel_shiftLeft0($this,  -$n | 0);
    return $this;
},
jm_BigInteger_shiftLeft = ($this, $n) => {
    if ($n && $this.$sign0)
        return $n > 0 ? jm_BitLevel_shiftLeft0($this, $n) : jm_BitLevel_shiftRight($this,  -$n | 0);
    return $this;
},
jm_BigInteger_shiftLeftOneBit = $this => {
    if ($this.$sign0)
        $this = jm_BitLevel_shiftLeftOneBit0($this);
    return $this;
},
jm_BigInteger_bitLength = $this => {
    return jm_BitLevel_bitLength($this);
},
jm_BigInteger_testBit = ($this, $n) => {
    let $intCount, $digit, var$4, $firstNonZeroDigit;
    if (!$n)
        return !($this.$digits.data[0] & 1) ? 0 : 1;
    if ($n < 0)
        $rt_throw(jl_ArithmeticException__init_($rt_s(53)));
    $intCount = $n >> 5;
    if ($intCount >= $this.$numberLength)
        return $this.$sign0 >= 0 ? 0 : 1;
    $digit = $this.$digits.data[$intCount];
    var$4 = 1 << ($n & 31);
    if ($this.$sign0 < 0) {
        $firstNonZeroDigit = $this.$getFirstNonzeroDigit();
        if ($intCount < $firstNonZeroDigit)
            return 0;
        $digit = $firstNonZeroDigit == $intCount ?  -$digit | 0 : $digit ^ (-1);
    }
    return !($digit & var$4) ? 0 : 1;
},
jm_BigInteger_getLowestSetBit = $this => {
    let $i;
    if (!$this.$sign0)
        return (-1);
    $i = $this.$getFirstNonzeroDigit();
    return ($i << 5) + jl_Integer_numberOfTrailingZeros($this.$digits.data[$i]) | 0;
},
jm_BigInteger_longValue = $this => {
    let $value;
    $value = $this.$numberLength <= 1 ? Long_and(Long_fromInt($this.$digits.data[0]), Long_create(4294967295, 0)) : Long_or(Long_shl(Long_fromInt($this.$digits.data[1]), 32), Long_and(Long_fromInt($this.$digits.data[0]), Long_create(4294967295, 0)));
    return Long_mul(Long_fromInt($this.$sign0), $value);
},
jm_BigInteger_compareTo = ($this, $val) => {
    if ($this.$sign0 > $val.$sign0)
        return 1;
    if ($this.$sign0 < $val.$sign0)
        return (-1);
    if ($this.$numberLength > $val.$numberLength)
        return $this.$sign0;
    if ($this.$numberLength < $val.$numberLength)
        return  -$val.$sign0 | 0;
    return $rt_imul($this.$sign0, jm_Elementary_compareArrays($this.$digits, $val.$digits, $this.$numberLength));
},
jm_BigInteger_equals = ($this, $x) => {
    let $x1;
    if ($this === $x)
        return 1;
    if (!($x instanceof jm_BigInteger))
        return 0;
    $x1 = $x;
    return $this.$sign0 == $x1.$sign0 && $this.$numberLength == $x1.$numberLength && $this.$equalsArrays($x1.$digits) ? 1 : 0;
},
jm_BigInteger_equalsArrays = ($this, $b) => {
    let $i, var$3;
    $i = $this.$numberLength - 1 | 0;
    while ($i >= 0) {
        var$3 = $b.data;
        if ($this.$digits.data[$i] != var$3[$i])
            break;
        $i = $i + (-1) | 0;
    }
    return $i >= 0 ? 0 : 1;
},
jm_BigInteger_multiply = ($this, $val) => {
    if (!$val.$sign0) {
        jm_BigInteger_$callClinit();
        return jm_BigInteger_ZERO;
    }
    if ($this.$sign0)
        return jm_Multiplication_multiply($this, $val);
    jm_BigInteger_$callClinit();
    return jm_BigInteger_ZERO;
},
jm_BigInteger_pow = ($this, $exp) => {
    let $x;
    if ($exp < 0)
        $rt_throw(jl_ArithmeticException__init_($rt_s(54)));
    if (!$exp) {
        jm_BigInteger_$callClinit();
        return jm_BigInteger_ONE;
    }
    if ($exp != 1) {
        jm_BigInteger_$callClinit();
        if (!$this.$equals0(jm_BigInteger_ONE) && !$this.$equals0(jm_BigInteger_ZERO)) {
            if ($this.$testBit(0))
                return jm_Multiplication_pow($this, $exp);
            $x = 1;
            while (!$this.$testBit($x)) {
                $x = $x + 1 | 0;
            }
            return (jm_BigInteger_getPowerOfTwo($rt_imul($x, $exp))).$multiply1(($this.$shiftRight0($x)).$pow1($exp));
        }
    }
    return $this;
},
jm_BigInteger_divideAndRemainder = ($this, $divisor) => {
    let $divisorSign, $divisorLen, $divisorDigits, $thisDigits, $thisLen, var$7, $cmp, var$9, var$10, $thisSign, $quotientLength, $quotientSign, $quotientDigits, $remainderDigits, $result0, $result1;
    $divisorSign = $divisor.$sign0;
    if (!$divisorSign)
        $rt_throw(jl_ArithmeticException__init_($rt_s(55)));
    $divisorLen = $divisor.$numberLength;
    $divisorDigits = $divisor.$digits;
    if ($divisorLen == 1)
        return jm_Division_divideAndRemainderByInteger($this, $divisorDigits.data[0], $divisorSign);
    $thisDigits = $this.$digits;
    $thisLen = $this.$numberLength;
    var$7 = $rt_compare($thisLen, $divisorLen);
    $cmp = !var$7 ? jm_Elementary_compareArrays($thisDigits, $divisorDigits, $thisLen) : var$7 <= 0 ? (-1) : 1;
    if ($cmp < 0) {
        var$9 = $rt_createArray(jm_BigInteger, 2);
        var$10 = var$9.data;
        jm_BigInteger_$callClinit();
        var$10[0] = jm_BigInteger_ZERO;
        var$10[1] = $this;
        return var$9;
    }
    $thisSign = $this.$sign0;
    $quotientLength = ($thisLen - $divisorLen | 0) + 1 | 0;
    $quotientSign = $thisSign != $divisorSign ? (-1) : 1;
    $quotientDigits = $rt_createIntArray($quotientLength);
    $remainderDigits = jm_Division_divide($quotientDigits, $quotientLength, $thisDigits, $thisLen, $divisorDigits, $divisorLen);
    $result0 = jm_BigInteger__init_($quotientSign, $quotientLength, $quotientDigits);
    $result1 = jm_BigInteger__init_($thisSign, $divisorLen, $remainderDigits);
    jm_BigInteger_cutOffLeadingZeroes($result0);
    jm_BigInteger_cutOffLeadingZeroes($result1);
    return $rt_wrapArray(jm_BigInteger, [$result0, $result1]);
},
jm_BigInteger_cutOffLeadingZeroes = $this => {
    let var$1, var$2, var$3;
    while ($this.$numberLength > 0) {
        var$1 = $this.$digits.data;
        var$2 = $this.$numberLength - 1 | 0;
        $this.$numberLength = var$2;
        if (var$1[var$2])
            break;
    }
    var$1 = $this.$digits.data;
    var$3 = $this.$numberLength;
    $this.$numberLength = var$3 + 1 | 0;
    if (!var$1[var$3])
        $this.$sign0 = 0;
},
jm_BigInteger_getFirstNonzeroDigit = $this => {
    let $i;
    if ($this.$firstNonzeroDigit == (-2)) {
        if (!$this.$sign0)
            $i = (-1);
        else {
            $i = 0;
            while (!$this.$digits.data[$i]) {
                $i = $i + 1 | 0;
            }
        }
        $this.$firstNonzeroDigit = $i;
    }
    return $this.$firstNonzeroDigit;
},
jm_BigInteger_getPowerOfTwo = $exp => {
    let $intCount, $bitN, var$4, $resDigits, var$6;
    jm_BigInteger_$callClinit();
    if ($exp < jm_BigInteger_TWO_POWS.data.length)
        return jm_BigInteger_TWO_POWS.data[$exp];
    $intCount = $exp >> 5;
    $bitN = $exp & 31;
    var$4 = $intCount + 1 | 0;
    $resDigits = $rt_createIntArray(var$4);
    var$6 = $resDigits.data;
    var$6[$intCount] = 1 << $bitN;
    return jm_BigInteger__init_(1, var$4, $resDigits);
},
jm_BigInteger__clinit_ = () => {
    let var$1, var$2, $i;
    jm_BigInteger_ZERO = jm_BigInteger__init_0(0, 0);
    jm_BigInteger_ONE = jm_BigInteger__init_0(1, 1);
    jm_BigInteger_TWO = jm_BigInteger__init_0(1, 2);
    jm_BigInteger_TEN = jm_BigInteger__init_0(1, 10);
    jm_BigInteger_MINUS_ONE = jm_BigInteger__init_0((-1), 1);
    var$1 = $rt_createArray(jm_BigInteger, 11);
    var$2 = var$1.data;
    var$2[0] = jm_BigInteger_ZERO;
    var$2[1] = jm_BigInteger_ONE;
    var$2[2] = jm_BigInteger_TWO;
    var$2[3] = jm_BigInteger__init_0(1, 3);
    var$2[4] = jm_BigInteger__init_0(1, 4);
    var$2[5] = jm_BigInteger__init_0(1, 5);
    var$2[6] = jm_BigInteger__init_0(1, 6);
    var$2[7] = jm_BigInteger__init_0(1, 7);
    var$2[8] = jm_BigInteger__init_0(1, 8);
    var$2[9] = jm_BigInteger__init_0(1, 9);
    var$2[10] = jm_BigInteger_TEN;
    jm_BigInteger_SMALL_VALUES = var$1;
    jm_BigInteger_TWO_POWS = $rt_createArray(jm_BigInteger, 32);
    $i = 0;
    while ($i < jm_BigInteger_TWO_POWS.data.length) {
        jm_BigInteger_TWO_POWS.data[$i] = jm_BigInteger_valueOf(Long_shl(Long_fromInt(1), $i));
        $i = $i + 1 | 0;
    }
},
jl_ArithmeticException = $rt_classWithoutFields(jl_RuntimeException),
jl_ArithmeticException__init_0 = ($this, $message) => {
    jl_RuntimeException__init_0($this, $message);
},
jl_ArithmeticException__init_ = var_0 => {
    let var_1 = new jl_ArithmeticException();
    jl_ArithmeticException__init_0(var_1, var_0);
    return var_1;
},
jl_AutoCloseable = $rt_classWithoutFields(0),
jus_BaseStream = $rt_classWithoutFields(0),
jus_IntStream = $rt_classWithoutFields(0);
let jus_IntStream_range = ($startInclusive, $endExclusive) => {
    return jusi_RangeIntStream__init_0($startInclusive, $endExclusive);
},
jusi_SimpleIntStreamImpl = $rt_classWithoutFields(),
jusi_SimpleIntStreamImpl__init_ = $this => {
    jl_Object__init_($this);
},
jusi_SimpleIntStreamImpl_filter = ($this, $predicate) => {
    return jusi_FilteringIntStreamImpl__init_0($this, $predicate);
},
jusi_SimpleIntStreamImpl_boxed = $this => {
    return jusi_BoxedIntStream__init_0($this);
},
jus_Collector = $rt_classWithoutFields(0),
jus_Collector_of = ($supplier, $accumulator, $combiner, $characteristics) => {
    return jus_Collector_of0($supplier, $accumulator, $combiner, jus_Collector$of$lambda$_5_0__init_0(), $characteristics);
},
jus_Collector_of0 = ($supplier, $accumulator, $combiner, $finisher, $characteristics) => {
    let $characteristicsSet;
    $characteristicsSet = ju_EnumSet_noneOf($rt_cls(jus_Collector$Characteristics));
    $characteristicsSet.$addAll(ju_Arrays_asList($characteristics));
    return jus_CollectorImpl__init_0($supplier, $accumulator, $combiner, $finisher, $characteristicsSet);
},
jus_Collector_lambda$of$0 = $x => {
    return $x;
};
function jusi_SimpleStreamImpl$collect$lambda$_26_0() {
    let a = this; jl_Object.call(a);
    a.$_05 = null;
    a.$_11 = null;
}
let jusi_SimpleStreamImpl$collect$lambda$_26_0__init_ = (var$0, var$1, var$2) => {
    jl_Object__init_(var$0);
    var$0.$_05 = var$1;
    var$0.$_11 = var$2;
},
jusi_SimpleStreamImpl$collect$lambda$_26_0__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_SimpleStreamImpl$collect$lambda$_26_0();
    jusi_SimpleStreamImpl$collect$lambda$_26_0__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_SimpleStreamImpl$collect$lambda$_26_0_test = (var$0, var$1) => {
    return jusi_SimpleStreamImpl_lambda$collect$4(var$0.$_05, var$0.$_11, var$1);
},
jl_Iterable = $rt_classWithoutFields(0),
jl_Iterable_forEach = ($this, $action) => {
    let $itr;
    $itr = $this.$iterator();
    while ($itr.$hasNext()) {
        $action.$accept0($itr.$next());
    }
},
ju_Collection = $rt_classWithoutFields(0),
ju_Collection_spliterator = $this => {
    return jusi_SpliteratorOverCollection__init_0($this);
},
ju_Collection_stream = $this => {
    return jusi_StreamOverSpliterator__init_0($this.$spliterator());
},
ju_AbstractCollection = $rt_classWithoutFields(),
ju_AbstractCollection__init_ = $this => {
    jl_Object__init_($this);
},
ju_AbstractCollection_isEmpty = $this => {
    return $this.$size() ? 0 : 1;
},
ju_AbstractCollection_contains = ($this, $o) => {
    let $iter, $e;
    $iter = $this.$iterator();
    while ($iter.$hasNext()) {
        $e = $iter.$next();
        if (ju_Objects_equals($e, $o))
            return 1;
    }
    return 0;
},
ju_AbstractCollection_toArray = ($this, $a) => {
    let var$2, $i, var$4, $iter;
    var$2 = $a.data;
    $i = $this.$size();
    var$4 = var$2.length;
    if (var$4 < $i)
        $a = jlr_Array_newInstance(jl_Class_getComponentType(jl_Object_getClass($a)), $i);
    else
        while ($i < var$4) {
            var$2[$i] = null;
            $i = $i + 1 | 0;
        }
    $i = 0;
    $iter = $this.$iterator();
    while ($iter.$hasNext()) {
        var$2 = $a.data;
        var$4 = $i + 1 | 0;
        var$2[$i] = $iter.$next();
        $i = var$4;
    }
    return $a;
},
ju_AbstractCollection_addAll = ($this, $c) => {
    let $changed, $iter;
    $changed = 0;
    $iter = $c.$iterator();
    while ($iter.$hasNext()) {
        if (!$this.$add($iter.$next()))
            continue;
        $changed = 1;
    }
    return $changed;
},
ju_AbstractCollection_toString = $this => {
    let $sb, $iter, $e, var$4;
    $sb = jl_StringBuilder__init_();
    $sb.$append0(91);
    $iter = $this.$iterator();
    if ($iter.$hasNext()) {
        $e = $iter.$next();
        if ($e === $this)
            $e = $rt_s(56);
        $sb.$append($e);
    }
    while ($iter.$hasNext()) {
        $e = $iter.$next();
        var$4 = $sb.$append1($rt_s(57));
        if ($e === $this)
            $e = $rt_s(56);
        var$4.$append($e);
    }
    $sb.$append0(93);
    return $sb.$toString();
},
ju_Set = $rt_classWithoutFields(0),
ju_AbstractSet = $rt_classWithoutFields(ju_AbstractCollection),
ju_AbstractSet__init_ = $this => {
    ju_AbstractCollection__init_($this);
},
ju_AbstractSet_equals = ($this, $obj) => {
    let $other, $iter;
    if ($this === $obj)
        return 1;
    if (!$rt_isInstance($obj, ju_Set))
        return 0;
    $other = $obj;
    if ($this.$size() != $other.$size())
        return 0;
    $iter = $other.$iterator();
    while ($iter.$hasNext()) {
        if ($this.$contains($iter.$next()))
            continue;
        else
            return 0;
    }
    return 1;
},
ju_AbstractSet_hashCode = $this => {
    let $result, $iter, $e;
    $result = 0;
    $iter = $this.$iterator();
    while ($iter.$hasNext()) {
        $e = $iter.$next();
        if ($e !== null)
            $result = $result + $e.$hashCode1() | 0;
    }
    return $result;
},
jl_Cloneable = $rt_classWithoutFields(0),
ju_EnumSet = $rt_classWithoutFields(ju_AbstractSet),
ju_EnumSet__init_ = $this => {
    ju_AbstractSet__init_($this);
},
ju_EnumSet_noneOf = $elementType => {
    return ju_GenericEnumSet__init_0($elementType);
};
function oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0() {
    jl_Object.call(this);
    this.$_0 = 0;
}
let oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_0 = var$1;
},
oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0__init_0 = var_0 => {
    let var_1 = new oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0();
    oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0__init_(var_1, var_0);
    return var_1;
},
oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0_test0 = (var$0, var$1) => {
    return oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0_test(var$0, var$1);
},
oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0_test = (var$0, var$1) => {
    return oajq_Circuit_lambda$initializeLevels$3(var$0.$_0, var$1);
};
function oajq_Qubit() {
    let a = this; jl_Object.call(a);
    a.$vector = null;
    a.$theta = 0.0;
    a.$phi = 0.0;
}
let oajq_Qubit__init_ = ($this, $alpha) => {
    let $beta, var$3, var$4, var$5;
    jl_Object__init_($this);
    $this.$theta = 0.0;
    $this.$phi = 0.0;
    $beta = jl_Math_sqrt(1.0 - jl_Math_pow($alpha, 2.0));
    var$3 = new oajm_ComplexVector;
    var$4 = $rt_createArray(oajm_Complex, 2);
    var$5 = var$4.data;
    var$5[0] = oajm_Complex__init_($alpha, 0.0);
    var$5[1] = oajm_Complex__init_($beta, 0.0);
    oajm_ComplexVector__init_(var$3, var$4);
    $this.$vector = var$3;
},
oajq_Qubit_getValue = $this => {
    return $this.$vector;
},
oajq_Qubit_equals = ($this, $obj) => {
    let $real0, $imaginary0, $real1, $imaginary1, var$6, $realObj0, $imaginarObj0, $realObj1, $imaginaryObj1;
    if ($this === $obj)
        return 1;
    if ($obj === null)
        return 0;
    if (jl_Object_getClass($this) !== jl_Object_getClass($obj))
        return 0;
    $real0 = oaju_Utils_round(oajm_Complex_getReal($this.$vector.$getEntry(0)), 4);
    $imaginary0 = oaju_Utils_round(oajm_Complex_getImaginary($this.$vector.$getEntry(0)), 4);
    $real1 = oaju_Utils_round(oajm_Complex_getReal($this.$vector.$getEntry(1)), 4);
    $imaginary1 = oaju_Utils_round(oajm_Complex_getImaginary($this.$vector.$getEntry(1)), 4);
    var$6 = $obj;
    $realObj0 = oaju_Utils_round(oajm_Complex_getReal(var$6.$vector.$getEntry(0)), 4);
    $imaginarObj0 = oaju_Utils_round(oajm_Complex_getImaginary(var$6.$vector.$getEntry(0)), 4);
    $realObj1 = oaju_Utils_round(oajm_Complex_getReal(var$6.$vector.$getEntry(1)), 4);
    $imaginaryObj1 = oaju_Utils_round(oajm_Complex_getImaginary(var$6.$vector.$getEntry(1)), 4);
    return $real0 === $realObj0 && $imaginary0 === $imaginarObj0 && $real1 === $realObj1 && $imaginary1 === $imaginaryObj1 ? 1 : 0;
},
oajq_QubitZero = $rt_classWithoutFields(oajq_Qubit),
oajq_QubitZero__init_0 = $this => {
    oajq_Qubit__init_($this, 1.0);
},
oajq_QubitZero__init_ = () => {
    let var_0 = new oajq_QubitZero();
    oajq_QubitZero__init_0(var_0);
    return var_0;
},
jl_CharSequence = $rt_classWithoutFields(0),
ju_SequencedMap = $rt_classWithoutFields(0),
jl_StringIndexOutOfBoundsException = $rt_classWithoutFields(jl_IndexOutOfBoundsException),
jl_StringIndexOutOfBoundsException__init_0 = $this => {
    jl_IndexOutOfBoundsException__init_0($this);
},
jl_StringIndexOutOfBoundsException__init_ = () => {
    let var_0 = new jl_StringIndexOutOfBoundsException();
    jl_StringIndexOutOfBoundsException__init_0(var_0);
    return var_0;
},
oajqs_QuantumSimulator = $rt_classWithoutFields(0);
function oajqs_LocalSimulator() {
    let a = this; jl_Object.call(a);
    a.$circuit = null;
    a.$quantumRegister = null;
}
let oajqs_LocalSimulator__init_ = ($this, $circuit, $random) => {
    jl_Object__init_($this);
    $this.$circuit = $circuit;
    $this.$quantumRegister = oajq_QuantumRegister__init_4($circuit.$getInputSize(), $circuit.$getConfig(), $random);
},
oajqs_LocalSimulator__init_3 = (var_0, var_1) => {
    let var_2 = new oajqs_LocalSimulator();
    oajqs_LocalSimulator__init_(var_2, var_0, var_1);
    return var_2;
},
oajqs_LocalSimulator__init_1 = ($this, $circuit, $initialState, $random) => {
    jl_Object__init_($this);
    $this.$circuit = $circuit;
    $this.$quantumRegister = oajq_QuantumRegister__init_3($circuit.$getInputSize(), $circuit.$getConfig(), $initialState, $random);
},
oajqs_LocalSimulator__init_4 = (var_0, var_1, var_2) => {
    let var_3 = new oajqs_LocalSimulator();
    oajqs_LocalSimulator__init_1(var_3, var_0, var_1, var_2);
    return var_3;
},
oajqs_LocalSimulator__init_0 = ($this, $circuit) => {
    jl_Object__init_($this);
    $this.$circuit = $circuit;
    $this.$quantumRegister = oajq_QuantumRegister__init_2($circuit.$getInputSize(), $circuit.$getConfig());
},
oajqs_LocalSimulator__init_2 = var_0 => {
    let var_1 = new oajqs_LocalSimulator();
    oajqs_LocalSimulator__init_0(var_1, var_0);
    return var_1;
},
oajqs_LocalSimulator_execute = $this => {
    ($this.$circuit.$getLevels()).$forEach(oajqs_LocalSimulator$execute$lambda$_5_0__init_0($this));
},
oajqs_LocalSimulator_getQuantumRegister = $this => {
    return $this.$quantumRegister;
},
oajqs_LocalSimulator_lambda$execute$0 = ($this, $level) => {
    ($level.$getGates()).$forEach(oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0__init_0($this));
},
oajqs_LocalSimulator_lambda$execute$1 = ($this, $gate) => {
    if (jl_String_equals($gate.$getType(), $rt_s(18))) {
        $this.$quantumRegister.$measureQubitAtIndexes($gate.$getIndexes());
        return;
    }
    if (jl_String_equals($gate.$getType(), $rt_s(19))) {
        $this.$quantumRegister.$resetQubitAtIndexes($gate.$getIndexes());
        return;
    }
    if (jl_String_equals($gate.$getType(), $rt_s(17)))
        return;
    if ($gate.$getNumberQubits() != 1)
        $this.$quantumRegister.$applyOperator($gate.$getMatrix(), $gate.$getIndexes());
    else
        ($gate.$getIndexes()).$forEach(oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0__init_0($this, $gate));
},
oajqs_LocalSimulator_lambda$execute$2 = ($this, $gate, $index) => {
    $this.$quantumRegister.$applyOperator($gate.$getMatrix(), ju_Collections_singletonList($index));
},
jus_Stream = $rt_classWithoutFields(0),
jus_Stream_toList = $this => {
    return ju_TemplateCollections$ImmutableArrayList__init_1($this.$toArray0());
},
jusi_SimpleStreamImpl = $rt_classWithoutFields(),
jusi_SimpleStreamImpl__init_ = $this => {
    jl_Object__init_($this);
},
jusi_SimpleStreamImpl_map = ($this, $mapper) => {
    return jusi_MappingStreamImpl__init_0($this, $mapper);
},
jusi_SimpleStreamImpl_flatMap = ($this, $mapper) => {
    return jusi_FlatMappingStreamImpl__init_0($this, $mapper);
},
jusi_SimpleStreamImpl_distinct = $this => {
    return jusi_DistinctStreamImpl__init_0($this);
},
jusi_SimpleStreamImpl_toArray0 = $this => {
    return $this.$toArray1(jusi_SimpleStreamImpl$toArray$lambda$_20_0__init_0());
},
jusi_SimpleStreamImpl_toArray = ($this, $generator) => {
    let $estimatedSize, $array, $consumer, var$5, $list, $i;
    $estimatedSize = $this.$estimateSize();
    if ($estimatedSize >= 0) {
        $array = $generator.$apply($estimatedSize);
        $consumer = jusi_SimpleStreamImpl$ArrayFillingConsumer__init_0($array);
        while ($this.$next0($consumer)) {
        }
        var$5 = $array.data;
        if ($consumer.$index0 < var$5.length)
            $array = ju_Arrays_copyOf($array, $consumer.$index0);
        return $array;
    }
    $list = ju_ArrayList__init_();
    while (true) {
        ju_Objects_requireNonNull0($list);
        if (!$this.$next0(jusi_SimpleStreamImpl$toArray$lambda$_21_0__init_0($list)))
            break;
    }
    $array = $generator.$apply($list.$size());
    $i = 0;
    while (true) {
        var$5 = $array.data;
        if ($i >= var$5.length)
            break;
        var$5[$i] = $list.$get($i);
        $i = $i + 1 | 0;
    }
    return $array;
},
jusi_SimpleStreamImpl_collect = ($this, $collector) => {
    let $collection, $accumulator, $hasMore;
    $collection = ($collector.$supplier()).$get2();
    $accumulator = $collector.$accumulator();
    while (true) {
        $hasMore = $this.$next0(jusi_SimpleStreamImpl$collect$lambda$_26_0__init_0($accumulator, $collection));
        if (!$hasMore)
            break;
    }
    return ($collector.$finisher()).$apply0($collection);
},
jusi_SimpleStreamImpl_count = $this => {
    let $consumer;
    $consumer = jusi_CountingConsumer__init_0();
    while ($this.$next0($consumer)) {
    }
    return Long_fromInt($consumer.$count1);
},
jusi_SimpleStreamImpl_anyMatch = ($this, $predicate) => {
    let $consumer;
    $consumer = jusi_AnyMatchConsumer__init_0($predicate);
    while (!$consumer.$matched0 && $this.$next0($consumer)) {
    }
    return $consumer.$matched0;
},
jusi_SimpleStreamImpl_allMatch = ($this, $predicate) => {
    let $consumer;
    $consumer = jusi_AllMatchConsumer__init_0($predicate);
    while ($consumer.$matched && $this.$next0($consumer)) {
    }
    return $consumer.$matched;
},
jusi_SimpleStreamImpl_iterator = $this => {
    return jusi_SimpleStreamIterator__init_0($this);
},
jusi_SimpleStreamImpl_close = $this => {
    return;
},
jusi_SimpleStreamImpl_lambda$collect$4 = ($accumulator, $collection, $e) => {
    $accumulator.$accept1($collection, $e);
    return 1;
},
jusi_SimpleStreamImpl_lambda$toArray$2 = $x$0 => {
    return $rt_createArray(jl_Object, $x$0);
};
function jusi_WrappingStreamImpl() {
    jusi_SimpleStreamImpl.call(this);
    this.$sourceStream = null;
}
let jusi_WrappingStreamImpl__init_ = ($this, $sourceStream) => {
    jusi_SimpleStreamImpl__init_($this);
    $this.$sourceStream = $sourceStream;
},
jusi_WrappingStreamImpl_next = ($this, $consumer) => {
    return $this.$sourceStream.$next0($this.$wrap($consumer));
},
jusi_WrappingStreamImpl_estimateSize = $this => {
    return $this.$sourceStream.$estimateSize();
},
jusi_DistinctStreamImpl = $rt_classWithoutFields(jusi_WrappingStreamImpl),
jusi_DistinctStreamImpl__init_ = ($this, $innerStream) => {
    jusi_WrappingStreamImpl__init_($this, $innerStream);
},
jusi_DistinctStreamImpl__init_0 = var_0 => {
    let var_1 = new jusi_DistinctStreamImpl();
    jusi_DistinctStreamImpl__init_(var_1, var_0);
    return var_1;
},
jusi_DistinctStreamImpl_wrap = ($this, $consumer) => {
    let $visited;
    $visited = ju_HashSet__init_1();
    return jusi_DistinctStreamImpl$wrap$lambda$_1_0__init_0($visited, $consumer);
},
jusi_DistinctStreamImpl_lambda$wrap$0 = ($visited, $consumer, $e) => {
    if ($visited.$add($e))
        return $consumer.$test1($e);
    return 1;
},
oajqg_Measurement = $rt_classWithoutFields(oajqg_Gate),
oajqg_Measurement__init_ = ($this, $indexes) => {
    oajqg_Gate__init_($this, 1, oajm_ComplexMatrix_createIdentityMatrix(2), $rt_s(18), $indexes);
},
oajqg_Measurement__init_0 = var_0 => {
    let var_1 = new oajqg_Measurement();
    oajqg_Measurement__init_(var_1, var_0);
    return var_1;
},
otci_Base46 = $rt_classWithoutFields(),
otci_Base46_decodeUnsigned = $seq => {
    let $number, $pos, var$4, var$5, $digit, $hasMore;
    $number = 0;
    $pos = 1;
    while (true) {
        var$4 = $seq.$characters.data;
        var$5 = $seq.$pointer;
        $seq.$pointer = var$5 + 1 | 0;
        $digit = otci_Base46_decodeDigit(var$4[var$5]);
        $hasMore = ($digit % 2 | 0) != 1 ? 0 : 1;
        $number = $number + $rt_imul($pos, $digit / 2 | 0) | 0;
        $pos = $pos * 46 | 0;
        if (!$hasMore)
            break;
    }
    return $number;
},
otci_Base46_decode = $seq => {
    let $number, $result;
    $number = otci_Base46_decodeUnsigned($seq);
    $result = $number / 2 | 0;
    if ($number % 2 | 0)
        $result =  -$result | 0;
    return $result;
},
otci_Base46_decodeDigit = $c => {
    if ($c < 34)
        return $c - 32 | 0;
    if ($c >= 92)
        return ($c - 32 | 0) - 2 | 0;
    return ($c - 32 | 0) - 1 | 0;
};
function oajq_CircuitLevel() {
    jl_Object.call(this);
    this.$gates0 = null;
}
let oajq_CircuitLevel__init_ = $this => {
    jl_Object__init_($this);
    $this.$gates0 = ju_ArrayList__init_();
},
oajq_CircuitLevel__init_0 = () => {
    let var_0 = new oajq_CircuitLevel();
    oajq_CircuitLevel__init_(var_0);
    return var_0;
},
oajq_CircuitLevel_addGate0 = ($this, $gate) => {
    oajq_CircuitLevel_verify($this, $gate);
    $this.$gates0.$add($gate);
},
oajq_CircuitLevel_addGate = ($this, $index, $gate) => {
    oajq_CircuitLevel_verify($this, $gate);
    if ($index.$intValue() >= $this.$gates0.$size())
        $this.$gates0.$add($gate);
    else
        $this.$gates0.$add1($index.$intValue(), $gate);
},
oajq_CircuitLevel_getGates = $this => {
    return $this.$gates0;
},
oajq_CircuitLevel_verify = ($this, $gate) => {
    let var$2, var$3, $verify;
    if (!$this.$gates0.$isEmpty()) {
        var$2 = $this.$gates0.$stream();
        var$3 = oajq_CircuitLevel$verify$lambda$_5_0__init_0();
        var$2 = var$2.$flatMap(var$3);
        var$3 = (($gate.$getIndexes()).$stream()).$collect(jus_Collectors_toList());
        ju_Objects_requireNonNull0(var$3);
        $verify = var$2.$anyMatch(oajq_CircuitLevel$verify$lambda$_5_1__init_0(var$3));
        if ($verify)
            $rt_throw(jl_IllegalArgumentException__init_($rt_s(58)));
    }
},
oajq_CircuitLevel_lambda$verify$0 = $g => {
    return ($g.$getIndexes()).$stream();
};
function ju_GenericEnumSet() {
    let a = this; ju_EnumSet.call(a);
    a.$cls = null;
    a.$bits = null;
}
let ju_GenericEnumSet__init_ = ($this, $cls) => {
    let $constants, $constantCount, $bitCount;
    ju_EnumSet__init_($this);
    $this.$cls = $cls;
    $constants = ju_GenericEnumSet_getConstants($cls);
    if ($constants === null)
        $rt_throw(jl_ClassCastException__init_0());
    $constantCount = $constants.data.length;
    $bitCount = !$constantCount ? 0 : (($constantCount - 1 | 0) / 32 | 0) + 1 | 0;
    $this.$bits = $rt_createIntArray($bitCount);
},
ju_GenericEnumSet__init_0 = var_0 => {
    let var_1 = new ju_GenericEnumSet();
    ju_GenericEnumSet__init_(var_1, var_0);
    return var_1;
},
ju_GenericEnumSet_getConstants = $cls => {
    return jl_Class_getEnumConstants($cls);
},
ju_GenericEnumSet_add = ($this, $t) => {
    let $tCls, $n, $bitNumber, $bit, var$6;
    $tCls = jl_Object_getClass($t);
    if ($tCls !== $this.$cls && jl_Class_getSuperclass($tCls) !== $this.$cls)
        $rt_throw(jl_ClassCastException__init_0());
    $n = jl_Enum_ordinal($t);
    $bitNumber = $n / 32 | 0;
    $bit = 1 << ($n % 32 | 0);
    if ($this.$bits.data[$bitNumber] & $bit)
        return 0;
    var$6 = $this.$bits.data;
    var$6[$bitNumber] = var$6[$bitNumber] | $bit;
    return 1;
},
ju_GenericEnumSet_addAll = ($this, $c) => {
    let $other, $added, $i, var$5;
    if ($c instanceof ju_GenericEnumSet) {
        $other = $c;
        if ($this.$cls === $other.$cls) {
            $added = 0;
            $i = 0;
            while ($i < $this.$bits.data.length) {
                if (($this.$bits.data[$i] | $other.$bits.data[$i]) != $this.$bits.data[$i]) {
                    $added = 1;
                    var$5 = $this.$bits.data;
                    var$5[$i] = var$5[$i] | $other.$bits.data[$i];
                }
                $i = $i + 1 | 0;
            }
            return $added;
        }
    }
    return ju_AbstractCollection_addAll($this, $c);
},
ju_GenericEnumSet_add0 = ($this, var$1) => {
    return $this.$add2(var$1);
},
oajqg_GenericGate = $rt_classWithoutFields(oajqg_Gate),
oajqg_GenericGate__init_ = ($this, $matrix, $size, $qubitIndex) => {
    oajqg_Gate__init_($this, $size, $matrix, $rt_s(32), $qubitIndex);
},
oajqg_GenericGate__init_0 = (var_0, var_1, var_2) => {
    let var_3 = new oajqg_GenericGate();
    oajqg_GenericGate__init_(var_3, var_0, var_1, var_2);
    return var_3;
};
function oajqs_LocalSimulator$execute$lambda$_5_0() {
    jl_Object.call(this);
    this.$_023 = null;
}
let oajqs_LocalSimulator$execute$lambda$_5_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_023 = var$1;
},
oajqs_LocalSimulator$execute$lambda$_5_0__init_0 = var_0 => {
    let var_1 = new oajqs_LocalSimulator$execute$lambda$_5_0();
    oajqs_LocalSimulator$execute$lambda$_5_0__init_(var_1, var_0);
    return var_1;
},
oajqs_LocalSimulator$execute$lambda$_5_0_accept0 = (var$0, var$1) => {
    oajqs_LocalSimulator$execute$lambda$_5_0_accept(var$0, var$1);
},
oajqs_LocalSimulator$execute$lambda$_5_0_accept = (var$0, var$1) => {
    oajqs_LocalSimulator_lambda$execute$0(var$0.$_023, var$1);
},
ju_Comparator = $rt_classWithoutFields(0),
jl_String$_clinit_$lambda$_118_0 = $rt_classWithoutFields(),
jl_String$_clinit_$lambda$_118_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jl_String$_clinit_$lambda$_118_0__init_0 = () => {
    let var_0 = new jl_String$_clinit_$lambda$_118_0();
    jl_String$_clinit_$lambda$_118_0__init_(var_0);
    return var_0;
};
function jl_AbstractStringBuilder() {
    let a = this; jl_Object.call(a);
    a.$buffer = null;
    a.$length0 = 0;
}
let jl_AbstractStringBuilder__init_0 = $this => {
    jl_AbstractStringBuilder__init_($this, 16);
},
jl_AbstractStringBuilder__init_6 = () => {
    let var_0 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_0(var_0);
    return var_0;
},
jl_AbstractStringBuilder__init_ = ($this, $capacity) => {
    jl_Object__init_($this);
    $this.$buffer = $rt_createCharArray($capacity);
},
jl_AbstractStringBuilder__init_3 = var_0 => {
    let var_1 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_(var_1, var_0);
    return var_1;
},
jl_AbstractStringBuilder__init_2 = ($this, $value) => {
    jl_AbstractStringBuilder__init_1($this, $value);
},
jl_AbstractStringBuilder__init_5 = var_0 => {
    let var_1 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_2(var_1, var_0);
    return var_1;
},
jl_AbstractStringBuilder__init_1 = ($this, $value) => {
    let $i;
    jl_Object__init_($this);
    $this.$buffer = $rt_createCharArray($value.$length());
    $i = 0;
    while ($i < $this.$buffer.data.length) {
        $this.$buffer.data[$i] = $value.$charAt($i);
        $i = $i + 1 | 0;
    }
    $this.$length0 = $value.$length();
},
jl_AbstractStringBuilder__init_4 = var_0 => {
    let var_1 = new jl_AbstractStringBuilder();
    jl_AbstractStringBuilder__init_1(var_1, var_0);
    return var_1;
},
jl_AbstractStringBuilder_append3 = ($this, $obj) => {
    return $this.$insert($this.$length0, $obj);
},
jl_AbstractStringBuilder_append = ($this, $string) => {
    return $this.$insert0($this.$length0, $string);
},
jl_AbstractStringBuilder_insert1 = ($this, $index, $string) => {
    let $i, var$4, var$5;
    if ($index >= 0 && $index <= $this.$length0) {
        if ($string === null)
            $string = $rt_s(59);
        else if (jl_String_isEmpty($string))
            return $this;
        $this.$ensureCapacity($this.$length0 + jl_String_length($string) | 0);
        $i = $this.$length0 - 1 | 0;
        while ($i >= $index) {
            $this.$buffer.data[$i + jl_String_length($string) | 0] = $this.$buffer.data[$i];
            $i = $i + (-1) | 0;
        }
        $this.$length0 = $this.$length0 + jl_String_length($string) | 0;
        $i = 0;
        while ($i < jl_String_length($string)) {
            var$4 = $this.$buffer.data;
            var$5 = $index + 1 | 0;
            var$4[$index] = jl_String_charAt($string, $i);
            $i = $i + 1 | 0;
            $index = var$5;
        }
        return $this;
    }
    $rt_throw(jl_StringIndexOutOfBoundsException__init_());
},
jl_AbstractStringBuilder_append0 = ($this, $value) => {
    return $this.$append3($value, 10);
},
jl_AbstractStringBuilder_append5 = ($this, $value, $radix) => {
    return $this.$insert1($this.$length0, $value, $radix);
},
jl_AbstractStringBuilder_insert4 = ($this, $target, $value, $radix) => {
    let $positive, var$5, var$6, $pos, $sz, $posLimit, var$10, var$11;
    $positive = 1;
    if ($value < 0) {
        $positive = 0;
        $value =  -$value | 0;
    }
    a: {
        if ($rt_ucmp($value, $radix) < 0) {
            if ($positive)
                jl_AbstractStringBuilder_insertSpace($this, $target, $target + 1 | 0);
            else {
                jl_AbstractStringBuilder_insertSpace($this, $target, $target + 2 | 0);
                var$5 = $this.$buffer.data;
                var$6 = $target + 1 | 0;
                var$5[$target] = 45;
                $target = var$6;
            }
            $this.$buffer.data[$target] = jl_Character_forDigit($value, $radix);
        } else {
            $pos = 1;
            $sz = 1;
            $posLimit = $rt_udiv((-1), $radix);
            b: {
                while (true) {
                    var$10 = $rt_imul($pos, $radix);
                    if ($rt_ucmp(var$10, $value) > 0) {
                        var$10 = $pos;
                        break b;
                    }
                    $sz = $sz + 1 | 0;
                    if ($rt_ucmp(var$10, $posLimit) > 0)
                        break;
                    $pos = var$10;
                }
            }
            if (!$positive)
                $sz = $sz + 1 | 0;
            jl_AbstractStringBuilder_insertSpace($this, $target, $target + $sz | 0);
            if ($positive)
                var$11 = $target;
            else {
                var$5 = $this.$buffer.data;
                var$11 = $target + 1 | 0;
                var$5[$target] = 45;
            }
            while (true) {
                if (!var$10)
                    break a;
                var$5 = $this.$buffer.data;
                var$6 = var$11 + 1 | 0;
                var$5[var$11] = jl_Character_forDigit($rt_udiv($value, var$10), $radix);
                $value = $rt_umod($value, var$10);
                var$10 = $rt_udiv(var$10, $radix);
                var$11 = var$6;
            }
        }
    }
    return $this;
},
jl_AbstractStringBuilder_append1 = ($this, $value) => {
    return $this.$insert2($this.$length0, $value);
},
jl_AbstractStringBuilder_insert0 = ($this, $target, $value) => {
    let var$3, var$4, var$5, $number, $mantissa, $exp, $negative, $intPart, $sz, $digits, $zeros, $leadingZeros, $leadingZero, var$16, $pos, $i, $intDigit, var$20;
    var$3 = $rt_compare_less($value, 0.0);
    if (!var$3) {
        if (1.0 / $value === Infinity) {
            jl_AbstractStringBuilder_insertSpace($this, $target, $target + 3 | 0);
            var$4 = $this.$buffer.data;
            var$3 = $target + 1 | 0;
            var$4[$target] = 48;
            var$4 = $this.$buffer.data;
            var$5 = var$3 + 1 | 0;
            var$4[var$3] = 46;
            $this.$buffer.data[var$5] = 48;
            return $this;
        }
        jl_AbstractStringBuilder_insertSpace($this, $target, $target + 4 | 0);
        var$4 = $this.$buffer.data;
        var$3 = $target + 1 | 0;
        var$4[$target] = 45;
        var$4 = $this.$buffer.data;
        var$5 = var$3 + 1 | 0;
        var$4[var$3] = 48;
        var$4 = $this.$buffer.data;
        var$3 = var$5 + 1 | 0;
        var$4[var$5] = 46;
        $this.$buffer.data[var$3] = 48;
        return $this;
    }
    if (isNaN($value) ? 1 : 0) {
        jl_AbstractStringBuilder_insertSpace($this, $target, $target + 3 | 0);
        var$4 = $this.$buffer.data;
        var$3 = $target + 1 | 0;
        var$4[$target] = 78;
        var$4 = $this.$buffer.data;
        var$5 = var$3 + 1 | 0;
        var$4[var$3] = 97;
        $this.$buffer.data[var$5] = 78;
        return $this;
    }
    if (jl_Double_isInfinite($value)) {
        if (var$3 > 0) {
            jl_AbstractStringBuilder_insertSpace($this, $target, $target + 8 | 0);
            var$3 = $target;
        } else {
            jl_AbstractStringBuilder_insertSpace($this, $target, $target + 9 | 0);
            var$4 = $this.$buffer.data;
            var$3 = $target + 1 | 0;
            var$4[$target] = 45;
        }
        var$4 = $this.$buffer.data;
        var$5 = var$3 + 1 | 0;
        var$4[var$3] = 73;
        var$4 = $this.$buffer.data;
        var$3 = var$5 + 1 | 0;
        var$4[var$5] = 110;
        var$4 = $this.$buffer.data;
        var$5 = var$3 + 1 | 0;
        var$4[var$3] = 102;
        var$4 = $this.$buffer.data;
        var$3 = var$5 + 1 | 0;
        var$4[var$5] = 105;
        var$4 = $this.$buffer.data;
        var$5 = var$3 + 1 | 0;
        var$4[var$3] = 110;
        var$4 = $this.$buffer.data;
        var$3 = var$5 + 1 | 0;
        var$4[var$5] = 105;
        var$4 = $this.$buffer.data;
        var$5 = var$3 + 1 | 0;
        var$4[var$3] = 116;
        $this.$buffer.data[var$5] = 121;
        return $this;
    }
    jl_AbstractStringBuilder$Constants_$callClinit();
    $number = jl_AbstractStringBuilder$Constants_doubleAnalysisResult;
    otcit_DoubleAnalyzer_analyze($value, $number);
    $mantissa = $number.$mantissa;
    $exp = $number.$exponent;
    $negative = $number.$sign1;
    $intPart = 1;
    $sz = 1;
    if ($negative)
        $sz = 2;
    $digits = 18;
    $zeros = jl_AbstractStringBuilder_trailingDecimalZeros($mantissa);
    if ($zeros > 0)
        $digits = $digits - $zeros | 0;
    $leadingZeros = 0;
    $leadingZero = 0;
    if ($exp < 7 && $exp >= (-3)) {
        if ($exp >= 0) {
            $intPart = $exp + 1 | 0;
            $digits = jl_Math_max($digits, $intPart + 1 | 0);
            $exp = 0;
        } else {
            $intPart = 0;
            $leadingZeros = ( -$exp | 0) - 1 | 0;
            $leadingZero = 1;
            $sz = $sz + 1 | 0;
            $exp = 0;
        }
    }
    if ($exp) {
        $sz = $sz + 2 | 0;
        if (!($exp > (-10) && $exp < 10))
            $sz = $sz + 1 | 0;
        if (!($exp > (-100) && $exp < 100))
            $sz = $sz + 1 | 0;
        if ($exp < 0)
            $sz = $sz + 1 | 0;
    }
    if ($exp && $digits == $intPart)
        $digits = $digits + 1 | 0;
    var$3 = $sz + ($digits + $leadingZeros | 0) | 0;
    jl_AbstractStringBuilder_insertSpace($this, $target, $target + var$3 | 0);
    if (!$negative)
        var$16 = $target;
    else {
        var$4 = $this.$buffer.data;
        var$16 = $target + 1 | 0;
        var$4[$target] = 45;
    }
    $pos = Long_create(1569325056, 23283064);
    if ($leadingZero) {
        var$4 = $this.$buffer.data;
        var$3 = var$16 + 1 | 0;
        var$4[var$16] = 48;
        var$4 = $this.$buffer.data;
        var$16 = var$3 + 1 | 0;
        var$4[var$3] = 46;
        while (true) {
            var$3 = $leadingZeros + (-1) | 0;
            if ($leadingZeros <= 0)
                break;
            var$4 = $this.$buffer.data;
            var$5 = var$16 + 1 | 0;
            var$4[var$16] = 48;
            $leadingZeros = var$3;
            var$16 = var$5;
        }
    }
    $i = 0;
    while ($i < $digits) {
        if (Long_le($pos, Long_ZERO))
            $intDigit = 0;
        else {
            $intDigit = Long_lo(Long_div($mantissa, $pos));
            $mantissa = Long_rem($mantissa, $pos);
        }
        var$4 = $this.$buffer.data;
        var$3 = var$16 + 1 | 0;
        var$4[var$16] = (48 + $intDigit | 0) & 65535;
        $intPart = $intPart + (-1) | 0;
        if ($intPart)
            var$16 = var$3;
        else {
            var$4 = $this.$buffer.data;
            var$16 = var$3 + 1 | 0;
            var$4[var$3] = 46;
        }
        $pos = Long_div($pos, Long_fromInt(10));
        $i = $i + 1 | 0;
    }
    if ($exp) {
        var$4 = $this.$buffer.data;
        var$3 = var$16 + 1 | 0;
        var$4[var$16] = 69;
        if ($exp >= 0)
            var$5 = var$3;
        else {
            $exp =  -$exp | 0;
            var$4 = $this.$buffer.data;
            var$5 = var$3 + 1 | 0;
            var$4[var$3] = 45;
        }
        if ($exp >= 100) {
            var$4 = $this.$buffer.data;
            var$3 = var$5 + 1 | 0;
            var$4[var$5] = (48 + ($exp / 100 | 0) | 0) & 65535;
            $exp = $exp % 100 | 0;
            var$4 = $this.$buffer.data;
            var$20 = var$3 + 1 | 0;
            var$4[var$3] = (48 + ($exp / 10 | 0) | 0) & 65535;
        } else if ($exp < 10)
            var$20 = var$5;
        else {
            var$4 = $this.$buffer.data;
            var$20 = var$5 + 1 | 0;
            var$4[var$5] = (48 + ($exp / 10 | 0) | 0) & 65535;
        }
        $this.$buffer.data[var$20] = (48 + ($exp % 10 | 0) | 0) & 65535;
    }
    return $this;
},
jl_AbstractStringBuilder_trailingDecimalZeros = $n => {
    let $zeros, $result, $bit, $i;
    $zeros = Long_fromInt(1);
    $result = 0;
    $bit = 16;
    jl_AbstractStringBuilder$Constants_$callClinit();
    $i = jl_AbstractStringBuilder$Constants_longLogPowersOfTen.data.length - 1 | 0;
    while ($i >= 0) {
        if (Long_eq(Long_rem($n, Long_mul($zeros, jl_AbstractStringBuilder$Constants_longLogPowersOfTen.data[$i])), Long_ZERO)) {
            $result = $result | $bit;
            $zeros = Long_mul($zeros, jl_AbstractStringBuilder$Constants_longLogPowersOfTen.data[$i]);
        }
        $bit = $bit >>> 1 | 0;
        $i = $i + (-1) | 0;
    }
    return $result;
},
jl_AbstractStringBuilder_append4 = ($this, $c) => {
    return $this.$insert3($this.$length0, $c);
},
jl_AbstractStringBuilder_insert3 = ($this, $index, $c) => {
    jl_AbstractStringBuilder_insertSpace($this, $index, $index + 1 | 0);
    $this.$buffer.data[$index] = $c;
    return $this;
},
jl_AbstractStringBuilder_insert2 = ($this, $index, $obj) => {
    return $this.$insert0($index, $obj === null ? $rt_s(59) : $obj.$toString());
},
jl_AbstractStringBuilder_ensureCapacity = ($this, $capacity) => {
    let $newLength;
    if ($this.$buffer.data.length >= $capacity)
        return;
    $newLength = $this.$buffer.data.length >= 1073741823 ? 2147483647 : jl_Math_max($capacity, jl_Math_max($this.$buffer.data.length * 2 | 0, 5));
    $this.$buffer = ju_Arrays_copyOf0($this.$buffer, $newLength);
},
jl_AbstractStringBuilder_toString = $this => {
    return jl_String__init_2($this.$buffer, 0, $this.$length0);
},
jl_AbstractStringBuilder_length = $this => {
    return $this.$length0;
},
jl_AbstractStringBuilder_charAt = ($this, $index) => {
    if ($index >= 0 && $index < $this.$length0)
        return $this.$buffer.data[$index];
    $rt_throw(jl_IndexOutOfBoundsException__init_());
},
jl_AbstractStringBuilder_append2 = ($this, $chars, $offset, $len) => {
    return $this.$insert4($this.$length0, $chars, $offset, $len);
},
jl_AbstractStringBuilder_insert = ($this, $index, $chars, $offset, $len) => {
    let var$5, var$6, var$7, var$8, var$9;
    jl_AbstractStringBuilder_insertSpace($this, $index, $index + $len | 0);
    var$5 = $len + $offset | 0;
    while ($offset < var$5) {
        var$6 = $chars.data;
        var$7 = $this.$buffer.data;
        var$8 = $index + 1 | 0;
        var$9 = $offset + 1 | 0;
        var$7[$index] = var$6[$offset];
        $index = var$8;
        $offset = var$9;
    }
    return $this;
},
jl_AbstractStringBuilder_insertSpace = ($this, $start, $end) => {
    let $sz, $i;
    $sz = $this.$length0 - $start | 0;
    $this.$ensureCapacity(($this.$length0 + $end | 0) - $start | 0);
    $i = $sz - 1 | 0;
    while ($i >= 0) {
        $this.$buffer.data[$end + $i | 0] = $this.$buffer.data[$start + $i | 0];
        $i = $i + (-1) | 0;
    }
    $this.$length0 = $this.$length0 + ($end - $start | 0) | 0;
},
jl_Appendable = $rt_classWithoutFields(0),
jl_StringBuilder = $rt_classWithoutFields(jl_AbstractStringBuilder),
jl_StringBuilder__init_4 = ($this, $capacity) => {
    jl_AbstractStringBuilder__init_($this, $capacity);
},
jl_StringBuilder__init_1 = var_0 => {
    let var_1 = new jl_StringBuilder();
    jl_StringBuilder__init_4(var_1, var_0);
    return var_1;
},
jl_StringBuilder__init_3 = $this => {
    jl_AbstractStringBuilder__init_0($this);
},
jl_StringBuilder__init_ = () => {
    let var_0 = new jl_StringBuilder();
    jl_StringBuilder__init_3(var_0);
    return var_0;
},
jl_StringBuilder__init_2 = ($this, $value) => {
    jl_AbstractStringBuilder__init_2($this, $value);
},
jl_StringBuilder__init_0 = var_0 => {
    let var_1 = new jl_StringBuilder();
    jl_StringBuilder__init_2(var_1, var_0);
    return var_1;
},
jl_StringBuilder_append = ($this, $obj) => {
    jl_AbstractStringBuilder_append3($this, $obj);
    return $this;
},
jl_StringBuilder_append2 = ($this, $string) => {
    jl_AbstractStringBuilder_append($this, $string);
    return $this;
},
jl_StringBuilder_append1 = ($this, $value) => {
    jl_AbstractStringBuilder_append0($this, $value);
    return $this;
},
jl_StringBuilder_append4 = ($this, $value) => {
    jl_AbstractStringBuilder_append1($this, $value);
    return $this;
},
jl_StringBuilder_append0 = ($this, $c) => {
    jl_AbstractStringBuilder_append4($this, $c);
    return $this;
},
jl_StringBuilder_append3 = ($this, $chars, $offset, $len) => {
    jl_AbstractStringBuilder_append2($this, $chars, $offset, $len);
    return $this;
},
jl_StringBuilder_insert4 = ($this, $target, $value) => {
    jl_AbstractStringBuilder_insert0($this, $target, $value);
    return $this;
},
jl_StringBuilder_insert2 = ($this, $index, $chars, $offset, $len) => {
    jl_AbstractStringBuilder_insert($this, $index, $chars, $offset, $len);
    return $this;
},
jl_StringBuilder_insert5 = ($this, $index, $obj) => {
    jl_AbstractStringBuilder_insert2($this, $index, $obj);
    return $this;
},
jl_StringBuilder_insert1 = ($this, $index, $c) => {
    jl_AbstractStringBuilder_insert3($this, $index, $c);
    return $this;
},
jl_StringBuilder_insert7 = ($this, $index, $string) => {
    jl_AbstractStringBuilder_insert1($this, $index, $string);
    return $this;
},
jl_StringBuilder_insert6 = ($this, var$1, var$2, var$3, var$4) => {
    return $this.$insert5(var$1, var$2, var$3, var$4);
},
jl_StringBuilder_charAt = ($this, var$1) => {
    return jl_AbstractStringBuilder_charAt($this, var$1);
},
jl_StringBuilder_length = $this => {
    return jl_AbstractStringBuilder_length($this);
},
jl_StringBuilder_toString = $this => {
    return jl_AbstractStringBuilder_toString($this);
};
let jl_StringBuilder_ensureCapacity = ($this, var$1) => {
    jl_AbstractStringBuilder_ensureCapacity($this, var$1);
},
jl_StringBuilder_insert0 = ($this, var$1, var$2) => {
    return $this.$insert6(var$1, var$2);
},
jl_StringBuilder_insert = ($this, var$1, var$2) => {
    return $this.$insert7(var$1, var$2);
},
jl_StringBuilder_insert3 = ($this, var$1, var$2) => {
    return $this.$insert8(var$1, var$2);
},
jl_StringBuilder_insert8 = ($this, var$1, var$2) => {
    return $this.$insert9(var$1, var$2);
};
function otrfm_AbstractInMemoryVirtualFile() {
    let a = this; jl_Object.call(a);
    a.$name2 = null;
    a.$lastModified = Long_ZERO;
}
let otrfm_AbstractInMemoryVirtualFile__init_ = ($this, $name) => {
    jl_Object__init_($this);
    $this.$lastModified = jl_System_currentTimeMillis();
    $this.$name2 = $name;
};
function otrfm_InMemoryVirtualDirectory() {
    otrfm_AbstractInMemoryVirtualFile.call(this);
    this.$children = null;
}
let otrfm_InMemoryVirtualDirectory__init_ = ($this, $name) => {
    otrfm_AbstractInMemoryVirtualFile__init_($this, $name);
    $this.$children = ju_LinkedHashMap__init_();
},
otrfm_InMemoryVirtualDirectory__init_0 = var_0 => {
    let var_1 = new otrfm_InMemoryVirtualDirectory();
    otrfm_InMemoryVirtualDirectory__init_(var_1, var_0);
    return var_1;
},
oajqg_Phase = $rt_classWithoutFields(oajqg_Gate),
oajqg_Phase__init_ = ($this, $theta, $indexes) => {
    oajqg_Gate__init_($this, 1, oaju_Constants_phaseMatrix($theta), $rt_s(29), $indexes);
},
oajqg_Phase__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_Phase();
    oajqg_Phase__init_(var_2, var_0, var_1);
    return var_2;
},
ju_ConcurrentModificationException = $rt_classWithoutFields(jl_RuntimeException),
ju_ConcurrentModificationException__init_0 = $this => {
    jl_RuntimeException__init_($this);
},
ju_ConcurrentModificationException__init_ = () => {
    let var_0 = new ju_ConcurrentModificationException();
    ju_ConcurrentModificationException__init_0(var_0);
    return var_0;
},
oajqg_Hadamard = $rt_classWithoutFields(oajqg_Gate),
oajqg_Hadamard__init_ = ($this, $qubitIndex) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 1, oaju_Constants_HADAMARD_MATRIX, $rt_s(11), $qubitIndex);
},
oajqg_Hadamard__init_0 = var_0 => {
    let var_1 = new oajqg_Hadamard();
    oajqg_Hadamard__init_(var_1, var_0);
    return var_1;
},
jur_RandomGenerator = $rt_classWithoutFields(0),
jur_RandomGenerator_nextBytes = ($this, $bytes) => {
    let var$2, var$3, $len, $i, $rnd, $j, $idx;
    var$2 = $bytes.data;
    var$3 = var$2.length;
    if (!var$3)
        return;
    $len = ((var$3 - 1 | 0) / 4 | 0) + 1 | 0;
    $i = 0;
    while ($i < $len) {
        $rnd = $this.$nextInt();
        $j = 0;
        while ($j < 4) {
            $idx = (4 * $i | 0) + $j | 0;
            if ($idx < var$3)
                var$2[$idx] = (255 & $rnd >> ($i * 8 | 0)) << 24 >> 24;
            $j = $j + 1 | 0;
        }
        $i = $i + 1 | 0;
    }
},
ju_Hashtable$1 = $rt_classWithoutFields(),
ju_Hashtable$1__init_ = $this => {
    jl_Object__init_($this);
},
ju_Hashtable$1__init_0 = () => {
    let var_0 = new ju_Hashtable$1();
    ju_Hashtable$1__init_(var_0);
    return var_0;
},
ju_Iterator = $rt_classWithoutFields(0),
ju_Hashtable$2 = $rt_classWithoutFields(),
ju_Hashtable$2__init_ = $this => {
    jl_Object__init_($this);
},
ju_Hashtable$2__init_0 = () => {
    let var_0 = new ju_Hashtable$2();
    ju_Hashtable$2__init_(var_0);
    return var_0;
},
ju_Map$Entry = $rt_classWithoutFields(0);
function ju_MapEntry() {
    let a = this; jl_Object.call(a);
    a.$key = null;
    a.$value = null;
}
let ju_MapEntry__init_ = ($this, $theKey, $theValue) => {
    jl_Object__init_($this);
    $this.$key = $theKey;
    $this.$value = $theValue;
},
ju_MapEntry__init_0 = (var_0, var_1) => {
    let var_2 = new ju_MapEntry();
    ju_MapEntry__init_(var_2, var_0, var_1);
    return var_2;
},
ju_MapEntry_equals = ($this, $object) => {
    let $entry;
    if ($this === $object)
        return 1;
    if (!$rt_isInstance($object, ju_Map$Entry))
        return 0;
    $entry = $object;
    return ju_Objects_equals($this.$key, $entry.$getKey()) && ju_Objects_equals($this.$value, $entry.$getValue()) ? 1 : 0;
},
ju_MapEntry_getKey = $this => {
    return $this.$key;
},
ju_MapEntry_getValue = $this => {
    return $this.$value;
},
ju_MapEntry_hashCode = $this => {
    return ju_Objects_hashCode($this.$key) ^ ju_Objects_hashCode($this.$value);
},
ju_MapEntry_toString = $this => {
    let var$1, var$2, var$3;
    var$1 = jl_String_valueOf($this.$key);
    var$2 = jl_String_valueOf($this.$value);
    var$3 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append0(jl_StringBuilder_append(var$3, var$1), 61), var$2);
    return jl_StringBuilder_toString(var$3);
};
function ju_Hashtable$Entry() {
    let a = this; ju_MapEntry.call(a);
    a.$next5 = null;
    a.$hashcode = 0;
}
let ju_Hashtable$Entry__init_ = ($this, $theKey, $theValue) => {
    ju_MapEntry__init_($this, $theKey, $theValue);
    $this.$hashcode = $theKey.$hashCode1();
},
ju_Hashtable$Entry__init_0 = (var_0, var_1) => {
    let var_2 = new ju_Hashtable$Entry();
    ju_Hashtable$Entry__init_(var_2, var_0, var_1);
    return var_2;
},
ju_Hashtable$Entry_getKeyHash = $this => {
    return $this.$key.$hashCode1();
},
ju_Hashtable$Entry_equalsKey = ($this, $aKey, $hash) => {
    return $this.$hashcode == $aKey.$hashCode1() && $this.$key.$equals0($aKey) ? 1 : 0;
},
oaju_Utils = $rt_classWithoutFields(),
oaju_Utils_round = ($value, $scale) => {
    let var$3, var$4, $rounded;
    var$3 = jm_BigDecimal__init_7(jl_Double_toString($value));
    jm_RoundingMode_$callClinit();
    var$4 = jm_RoundingMode_HALF_UP;
    var$3 = var$3.$setScale($scale, var$4);
    $rounded = var$3.$doubleValue();
    if ($rounded === 0.0)
        $rounded = 0.0 * $value;
    return $rounded;
},
oajqg_Reset = $rt_classWithoutFields(oajqg_Gate),
oajqg_Reset__init_ = ($this, $indexes) => {
    oajqg_Gate__init_($this, 1, oajm_ComplexMatrix_createIdentityMatrix(2), $rt_s(19), $indexes);
},
oajqg_Reset__init_0 = var_0 => {
    let var_1 = new oajqg_Reset();
    oajqg_Reset__init_(var_1, var_0);
    return var_1;
},
jl_ClassCastException = $rt_classWithoutFields(jl_RuntimeException),
jl_ClassCastException__init_ = $this => {
    jl_RuntimeException__init_($this);
},
jl_ClassCastException__init_0 = () => {
    let var_0 = new jl_ClassCastException();
    jl_ClassCastException__init_(var_0);
    return var_0;
};
function ju_AbstractMap() {
    jl_Object.call(this);
    this.$cachedKeySet = null;
}
let ju_AbstractMap__init_ = $this => {
    jl_Object__init_($this);
},
ju_AbstractMap_equals = ($this, $obj) => {
    let $other, $it, $entry, $$je;
    if ($this === $obj)
        return 1;
    if (!$rt_isInstance($obj, ju_Map))
        return 0;
    $other = $obj;
    if ($this.$size() != $other.$size())
        return 0;
    a: {
        try {
            $it = ($this.$entrySet()).$iterator();
        } catch ($$e) {
            $$je = $rt_wrapException($$e);
            if ($$je instanceof jl_ClassCastException) {
                break a;
            } else if ($$je instanceof jl_NullPointerException) {
                break a;
            } else {
                throw $$e;
            }
        }
        b: {
            c: {
                try {
                    while ($it.$hasNext()) {
                        $entry = $it.$next();
                        if (!$other.$containsKey($entry.$getKey()))
                            break b;
                        if (!ju_Objects_equals($entry.$getValue(), $other.$get0($entry.$getKey())))
                            break c;
                    }
                } catch ($$e) {
                    $$je = $rt_wrapException($$e);
                    if ($$je instanceof jl_ClassCastException) {
                        break a;
                    } else if ($$je instanceof jl_NullPointerException) {
                        break a;
                    } else {
                        throw $$e;
                    }
                }
                return 1;
            }
            try {
            } catch ($$e) {
                $$je = $rt_wrapException($$e);
                if ($$je instanceof jl_ClassCastException) {
                    break a;
                } else if ($$je instanceof jl_NullPointerException) {
                    break a;
                } else {
                    throw $$e;
                }
            }
            return 0;
        }
        try {
        } catch ($$e) {
            $$je = $rt_wrapException($$e);
            if ($$je instanceof jl_ClassCastException) {
                break a;
            } else if ($$je instanceof jl_NullPointerException) {
                break a;
            } else {
                throw $$e;
            }
        }
        return 0;
    }
    return 0;
},
ju_AbstractMap_hashCode = $this => {
    let $result, $iter, $entry;
    $result = 0;
    $iter = ($this.$entrySet()).$iterator();
    while ($iter.$hasNext()) {
        $entry = $iter.$next();
        $result = $result + $entry.$hashCode1() | 0;
    }
    return $result;
},
ju_AbstractMap_toString = $this => {
    let $sb, $iter, $e;
    $sb = jl_StringBuilder__init_();
    $sb.$append0(123);
    $iter = ($this.$entrySet()).$iterator();
    if ($iter.$hasNext()) {
        $e = $iter.$next();
        $sb.$append($e.$getKey() !== $this ? $e.$getKey() : $rt_s(60));
        $sb.$append0(61);
        $sb.$append($e.$getValue() !== $this ? $e.$getValue() : $rt_s(60));
    }
    while ($iter.$hasNext()) {
        $sb.$append1($rt_s(57));
        $e = $iter.$next();
        $sb.$append($e.$getKey() !== $this ? $e.$getKey() : $rt_s(60));
        $sb.$append0(61);
        $sb.$append($e.$getValue() !== $this ? $e.$getValue() : $rt_s(60));
    }
    $sb.$append0(125);
    return $sb.$toString();
};
function ju_HashMap() {
    let a = this; ju_AbstractMap.call(a);
    a.$elementCount = 0;
    a.$elementData = null;
    a.$modCount = 0;
    a.$loadFactor0 = 0.0;
    a.$threshold = 0;
}
let ju_HashMap_newElementArray = ($this, $s) => {
    return $rt_createArray(ju_HashMap$HashEntry, $s);
},
ju_HashMap__init_0 = $this => {
    ju_HashMap__init_($this, 16);
},
ju_HashMap__init_2 = () => {
    let var_0 = new ju_HashMap();
    ju_HashMap__init_0(var_0);
    return var_0;
},
ju_HashMap__init_ = ($this, $capacity) => {
    ju_HashMap__init_1($this, $capacity, 0.75);
},
ju_HashMap__init_3 = var_0 => {
    let var_1 = new ju_HashMap();
    ju_HashMap__init_(var_1, var_0);
    return var_1;
},
ju_HashMap_calculateCapacity = $x => {
    let var$2, var$3;
    if ($x >= 1073741824)
        return 1073741824;
    if (!$x)
        return 16;
    var$2 = $x - 1 | 0;
    var$3 = var$2 | var$2 >> 1;
    var$3 = var$3 | var$3 >> 2;
    var$3 = var$3 | var$3 >> 4;
    var$3 = var$3 | var$3 >> 8;
    var$3 = var$3 | var$3 >> 16;
    return var$3 + 1 | 0;
},
ju_HashMap__init_1 = ($this, $capacity, $loadFactor) => {
    let var$3;
    ju_AbstractMap__init_($this);
    if ($capacity >= 0 && $loadFactor > 0.0) {
        var$3 = ju_HashMap_calculateCapacity($capacity);
        $this.$elementCount = 0;
        $this.$elementData = $this.$newElementArray(var$3);
        $this.$loadFactor0 = $loadFactor;
        ju_HashMap_computeThreshold($this);
        return;
    }
    $rt_throw(jl_IllegalArgumentException__init_0());
},
ju_HashMap__init_4 = (var_0, var_1) => {
    let var_2 = new ju_HashMap();
    ju_HashMap__init_1(var_2, var_0, var_1);
    return var_2;
},
ju_HashMap_computeThreshold = $this => {
    $this.$threshold = $this.$elementData.data.length * $this.$loadFactor0 | 0;
},
ju_HashMap_containsKey = ($this, $key) => {
    let $m;
    $m = ju_HashMap_entryByKey($this, $key);
    return $m === null ? 0 : 1;
},
ju_HashMap_entryByKey = ($this, $key) => {
    let $m, $hash, $index;
    if ($key === null)
        $m = ju_HashMap_findNullKeyEntry($this);
    else {
        $hash = $key.$hashCode1();
        $index = $hash & ($this.$elementData.data.length - 1 | 0);
        $m = ju_HashMap_findNonNullKeyEntry($this, $key, $index, $hash);
    }
    return $m;
},
ju_HashMap_findNonNullKeyEntry = ($this, $key, $index, $keyHash) => {
    let $m;
    $m = $this.$elementData.data[$index];
    while ($m !== null && !($m.$origKeyHash == $keyHash && ju_HashMap_areEqualKeys($key, $m.$key))) {
        $m = $m.$next4;
    }
    return $m;
},
ju_HashMap_findNullKeyEntry = $this => {
    let $m;
    $m = $this.$elementData.data[0];
    while ($m !== null && $m.$key !== null) {
        $m = $m.$next4;
    }
    return $m;
},
ju_HashMap_keySet = $this => {
    if ($this.$cachedKeySet === null)
        $this.$cachedKeySet = ju_HashMap$1__init_0($this);
    return $this.$cachedKeySet;
},
ju_HashMap_put = ($this, $key, $value) => {
    return ju_HashMap_putImpl($this, $key, $value);
},
ju_HashMap_putImpl = ($this, $key, $value) => {
    let $entry, var$4, $hash, $index, $result;
    if ($key === null) {
        $entry = ju_HashMap_findNullKeyEntry($this);
        if ($entry === null) {
            $this.$modCount = $this.$modCount + 1 | 0;
            $entry = ju_HashMap_createHashedEntry($this, null, 0, 0);
            var$4 = $this.$elementCount + 1 | 0;
            $this.$elementCount = var$4;
            if (var$4 > $this.$threshold)
                $this.$rehash();
        }
    } else {
        $hash = $key.$hashCode1();
        $index = $hash & ($this.$elementData.data.length - 1 | 0);
        $entry = ju_HashMap_findNonNullKeyEntry($this, $key, $index, $hash);
        if ($entry === null) {
            $this.$modCount = $this.$modCount + 1 | 0;
            $entry = ju_HashMap_createHashedEntry($this, $key, $index, $hash);
            var$4 = $this.$elementCount + 1 | 0;
            $this.$elementCount = var$4;
            if (var$4 > $this.$threshold)
                $this.$rehash();
        }
    }
    $result = $entry.$value;
    $entry.$value = $value;
    return $result;
},
ju_HashMap_createHashedEntry = ($this, $key, $index, $hash) => {
    let $entry;
    $entry = ju_HashMap$HashEntry__init_0($key, $hash);
    $entry.$next4 = $this.$elementData.data[$index];
    $this.$elementData.data[$index] = $entry;
    return $entry;
},
ju_HashMap_rehash0 = ($this, $capacity) => {
    let $length, $newData, $i, $entry, var$6, $index, $next;
    $length = ju_HashMap_calculateCapacity(!$capacity ? 1 : $capacity << 1);
    $newData = $this.$newElementArray($length);
    $i = 0;
    while ($i < $this.$elementData.data.length) {
        $entry = $this.$elementData.data[$i];
        $this.$elementData.data[$i] = null;
        while ($entry !== null) {
            var$6 = $newData.data;
            $index = $entry.$origKeyHash & ($length - 1 | 0);
            $next = $entry.$next4;
            $entry.$next4 = var$6[$index];
            var$6[$index] = $entry;
            $entry = $next;
        }
        $i = $i + 1 | 0;
    }
    $this.$elementData = $newData;
    ju_HashMap_computeThreshold($this);
},
ju_HashMap_rehash = $this => {
    $this.$rehash0($this.$elementData.data.length);
},
ju_HashMap_removeEntry = ($this, $entry) => {
    let $index, $m;
    $index = $entry.$origKeyHash & ($this.$elementData.data.length - 1 | 0);
    $m = $this.$elementData.data[$index];
    if ($m === $entry)
        $this.$elementData.data[$index] = $entry.$next4;
    else {
        while ($m.$next4 !== $entry) {
            $m = $m.$next4;
        }
        $m.$next4 = $entry.$next4;
    }
    $this.$modCount = $this.$modCount + 1 | 0;
    $this.$elementCount = $this.$elementCount - 1 | 0;
},
ju_HashMap_size = $this => {
    return $this.$elementCount;
},
ju_HashMap_areEqualKeys = ($key1, $key2) => {
    return $key1 !== $key2 && !$key1.$equals0($key2) ? 0 : 1;
};
function ju_LinkedHashMap() {
    let a = this; ju_HashMap.call(a);
    a.$accessOrder = 0;
    a.$head = null;
    a.$tail = null;
}
let ju_LinkedHashMap__init_0 = $this => {
    ju_HashMap__init_0($this);
    $this.$accessOrder = 0;
    $this.$head = null;
},
ju_LinkedHashMap__init_ = () => {
    let var_0 = new ju_LinkedHashMap();
    ju_LinkedHashMap__init_0(var_0);
    return var_0;
},
ju_LinkedHashMap_newElementArray = ($this, $s) => {
    return $rt_createArray(ju_LinkedHashMap$LinkedHashMapEntry, $s);
},
ju_LinkedHashMap_getOrDefault = ($this, $key, $defaultValue) => {
    let $entry, $hash, $index;
    if ($key === null)
        $entry = ju_HashMap_findNullKeyEntry($this);
    else {
        $hash = $key.$hashCode1();
        $index = ($hash & 2147483647) % $this.$elementData.data.length | 0;
        $entry = ju_HashMap_findNonNullKeyEntry($this, $key, $index, $hash);
    }
    if ($entry === null)
        return $defaultValue;
    if ($this.$accessOrder)
        ju_LinkedHashMap_linkEntry($this, $entry, 0);
    return $entry.$value;
},
ju_LinkedHashMap_get = ($this, $key) => {
    return $this.$getOrDefault($key, null);
},
ju_LinkedHashMap_createHashedEntry = ($this, $key, $index, $hash, $first) => {
    let $entry;
    $entry = ju_LinkedHashMap$LinkedHashMapEntry__init_0($key, $hash);
    $entry.$next4 = $this.$elementData.data[$index];
    $this.$elementData.data[$index] = $entry;
    if (!$first) {
        if ($this.$tail === null)
            $this.$head = $entry;
        else
            $this.$tail.$chainForward = $entry;
        $entry.$chainBackward = $this.$tail;
        $this.$tail = $entry;
    } else {
        if ($this.$head === null)
            $this.$tail = $entry;
        else
            $this.$head.$chainBackward = $entry;
        $entry.$chainForward = $this.$head;
        $this.$head = $entry;
    }
    return $entry;
},
ju_LinkedHashMap_put = ($this, $key, $value) => {
    let $oldSize, $existing;
    $oldSize = $this.$size();
    $existing = $this.$putImpl0($key, $value, 0, $this.$accessOrder);
    if ($this.$size() != $oldSize && $this.$removeEldestEntry($this.$head))
        $this.$removeLinkedEntry($this.$head);
    return $existing;
},
ju_LinkedHashMap_putImpl = ($this, $key, $value, $first, $forceMotion) => {
    let $hash, var$6, $index, $entry, var$9, $existing;
    if (!$this.$elementCount) {
        $this.$head = null;
        $this.$tail = null;
    }
    $hash = ju_Objects_hashCode($key);
    var$6 = $hash & 2147483647;
    $index = var$6 % $this.$elementData.data.length | 0;
    $entry = $key === null ? ju_HashMap_findNullKeyEntry($this) : ju_HashMap_findNonNullKeyEntry($this, $key, $index, $hash);
    if ($entry === null) {
        $this.$modCount = $this.$modCount + 1 | 0;
        var$9 = $this.$elementCount + 1 | 0;
        $this.$elementCount = var$9;
        if (var$9 > $this.$threshold) {
            $this.$rehash();
            $index = var$6 % $this.$elementData.data.length | 0;
        }
        $entry = ju_LinkedHashMap_createHashedEntry($this, $key, $index, $hash, $first);
    } else if ($forceMotion)
        ju_LinkedHashMap_linkEntry($this, $entry, $first);
    $existing = $entry.$value;
    $entry.$value = $value;
    return $existing;
},
ju_LinkedHashMap_linkEntry = ($this, $entry, $first) => {
    let $n, $p;
    if (!$first) {
        $n = $entry.$chainForward;
        if ($n === null)
            return;
        $p = $entry.$chainBackward;
        if ($p === null)
            $this.$head = $n;
        else
            $p.$chainForward = $n;
        $n.$chainBackward = $p;
        if ($this.$tail !== null)
            $this.$tail.$chainForward = $entry;
        $entry.$chainBackward = $this.$tail;
        $entry.$chainForward = null;
        $this.$tail = $entry;
    } else {
        $p = $entry.$chainBackward;
        if ($p === null)
            return;
        $n = $entry.$chainForward;
        if ($n === null)
            $this.$tail = $p;
        else
            $n.$chainBackward = $p;
        $p.$chainForward = $n;
        if ($this.$head !== null)
            $this.$head.$chainBackward = $entry;
        $entry.$chainForward = $this.$head;
        $entry.$chainBackward = null;
        $this.$head = $entry;
    }
},
ju_LinkedHashMap_entrySet = $this => {
    return ju_LinkedHashMapEntrySet__init_0($this, 0);
},
ju_LinkedHashMap_removeLinkedEntry = ($this, $entry) => {
    ju_HashMap_removeEntry($this, $entry);
    ju_LinkedHashMap_unlinkEntry($this, $entry);
},
ju_LinkedHashMap_unlinkEntry = ($this, $entry) => {
    let $p, $n;
    $p = $entry.$chainBackward;
    $n = $entry.$chainForward;
    if ($p !== null) {
        $p.$chainForward = $n;
        if ($n === null)
            $this.$tail = $p;
        else
            $n.$chainBackward = $p;
    } else {
        $this.$head = $n;
        if ($n === null)
            $this.$tail = null;
        else
            $n.$chainBackward = null;
    }
},
ju_LinkedHashMap_removeEldestEntry = ($this, $eldest) => {
    return 0;
};
function jusi_FlatMappingStreamImpl$next$lambda$_1_0() {
    jl_Object.call(this);
    this.$_07 = null;
}
let jusi_FlatMappingStreamImpl$next$lambda$_1_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_07 = var$1;
},
jusi_FlatMappingStreamImpl$next$lambda$_1_0__init_0 = var_0 => {
    let var_1 = new jusi_FlatMappingStreamImpl$next$lambda$_1_0();
    jusi_FlatMappingStreamImpl$next$lambda$_1_0__init_(var_1, var_0);
    return var_1;
},
jusi_FlatMappingStreamImpl$next$lambda$_1_0_test = (var$0, var$1) => {
    return jusi_FlatMappingStreamImpl_lambda$next$0(var$0.$_07, var$1);
},
oajq_QubitOne = $rt_classWithoutFields(oajq_Qubit),
oajq_QubitOne__init_0 = $this => {
    oajq_Qubit__init_($this, 0.0);
},
oajq_QubitOne__init_ = () => {
    let var_0 = new oajq_QubitOne();
    oajq_QubitOne__init_0(var_0);
    return var_0;
},
oajqs_CircuitSampler = $rt_classWithoutFields(),
oajqs_CircuitSampler_sample = ($circuit, $options) => {
    return oajqs_CircuitSampler_execute($circuit, $options, null);
},
oajqs_CircuitSampler_execute = ($circuit, $options, $initialState) => {
    let $size, $indexes, $work, $passes, var$8, $level, var$10, $gate, var$12, $random, var$14, $counts, $one, $shot, $simulator, $measured, $outcome, var$21, var$22, $index;
    ju_Objects_requireNonNull($circuit, $rt_s(61));
    ju_Objects_requireNonNull($options, $rt_s(62));
    $size = $circuit.$getInputSize();
    $indexes = oajqs_SamplingOptions_indexesFor($options, $size);
    $work = Long_mul(Long_fromInt(oajqs_SamplingOptions_shots($options)), Long_shl(Long_fromInt(1), $size));
    $passes = Long_fromInt(1);
    var$8 = ($circuit.$getLevels()).$iterator();
    while (var$8.$hasNext()) {
        $level = var$8.$next();
        var$10 = ($level.$getGates()).$iterator();
        while (var$10.$hasNext()) {
            $gate = var$10.$next();
            $passes = Long_add($passes, Long_fromInt(($gate.$getIndexes()).$size()));
        }
    }
    if (Long_gt($work, Long_div(oajqs_SamplingOptions_maxWork($options), $passes)))
        $rt_throw(oaje_JQApiLimitException__init_($rt_s(63)));
    var$12 = $indexes.data;
    $random = oajqs_SamplingOptions_newRandom($options);
    var$14 = var$12.length;
    $counts = $rt_createIntArray(1 << var$14);
    $one = oajq_QubitOne__init_();
    $shot = 0;
    while ($shot < oajqs_SamplingOptions_shots($options)) {
        $simulator = $initialState !== null ? oajqs_LocalSimulator__init_4($circuit, $initialState, $random) : oajqs_LocalSimulator__init_3($circuit, $random);
        $simulator.$execute0();
        ($simulator.$getQuantumRegister()).$measure();
        $measured = ($simulator.$getQuantumRegister()).$getResult();
        $outcome = 0;
        var$21 = 0;
        while (var$21 < var$14) {
            var$22 = $measured.data;
            $index = var$12[var$21];
            $outcome = $outcome << 1 | (!var$22[$index].$equals0($one) ? 0 : 1);
            var$21 = var$21 + 1 | 0;
        }
        var$22 = $counts.data;
        var$22[$outcome] = var$22[$outcome] + 1 | 0;
        $shot = $shot + 1 | 0;
    }
    return oajqs_SamplingResult__init_0(oajqs_SamplingOptions_shots($options), $indexes, $counts);
};
function oajm_ComplexMatrix() {
    let a = this; jl_Object.call(a);
    a.$data1 = null;
    a.$rows = 0;
    a.$cols = 0;
}
let oajm_ComplexMatrix__init_0 = ($this, $values) => {
    let var$2, $r, $c, $flat, var$6, var$7;
    var$2 = $values.data;
    jl_Object__init_($this);
    $this.$rows = var$2.length;
    $this.$cols = var$2[0].data.length;
    $this.$data1 = $rt_createDoubleArray($rt_imul($this.$rows, $this.$cols) * 2 | 0);
    $r = 0;
    while ($r < $this.$rows) {
        $c = 0;
        while ($c < $this.$cols) {
            $flat = $rt_imul($r, $this.$cols) + $c | 0;
            var$6 = $this.$data1.data;
            var$7 = 2 * $flat | 0;
            var$6[var$7] = oajm_Complex_getReal(var$2[$r].data[$c]);
            $this.$data1.data[var$7 + 1 | 0] = oajm_Complex_getImaginary(var$2[$r].data[$c]);
            $c = $c + 1 | 0;
        }
        $r = $r + 1 | 0;
    }
},
oajm_ComplexMatrix__init_ = var_0 => {
    let var_1 = new oajm_ComplexMatrix();
    oajm_ComplexMatrix__init_0(var_1, var_0);
    return var_1;
},
oajm_ComplexMatrix_createIdentityMatrix = $size => {
    let $values, $r, $c, var$5, var$6;
    $values = $rt_createMultiArray(oajm_Complex, [$size, $size]);
    $r = 0;
    while ($r < $size) {
        $c = 0;
        while ($c < $size) {
            var$5 = $values.data[$r];
            if ($r != $c) {
                oajm_Complex_$callClinit();
                var$6 = oajm_Complex_ZERO;
            } else {
                oajm_Complex_$callClinit();
                var$6 = oajm_Complex_ONE;
            }
            var$5.data[$c] = var$6;
            $c = $c + 1 | 0;
        }
        $r = $r + 1 | 0;
    }
    return oajm_ComplexMatrix__init_($values);
},
oajm_ComplexMatrix_createMatrixWithData = $data => {
    return oajm_ComplexMatrix__init_($data);
},
oajm_ComplexMatrix_multiControlledMatrix = ($u, $numControls) => {
    let $uDim, $d, $data, $r, $c, var$8, var$9, $base;
    if ($numControls < 1)
        $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($rt_s(64))).$append2($numControls)).$toString()));
    $uDim = $u.$getRowDimension();
    if ($u.$getColumnDimension() != $uDim)
        $rt_throw(jl_IllegalArgumentException__init_($rt_s(65)));
    if ($uDim >= 2 && !($uDim & ($uDim - 1 | 0))) {
        $d = $rt_imul(1 << $numControls, $uDim);
        $data = $rt_createMultiArray(oajm_Complex, [$d, $d]);
        $r = 0;
        while ($r < $d) {
            $c = 0;
            while ($c < $d) {
                var$8 = $data.data[$r];
                if ($r != $c) {
                    oajm_Complex_$callClinit();
                    var$9 = oajm_Complex_ZERO;
                } else {
                    oajm_Complex_$callClinit();
                    var$9 = oajm_Complex_ONE;
                }
                var$8.data[$c] = var$9;
                $c = $c + 1 | 0;
            }
            $r = $r + 1 | 0;
        }
        $base = $d - $uDim | 0;
        $r = 0;
        while ($r < $uDim) {
            $c = 0;
            while ($c < $uDim) {
                $data.data[$base + $r | 0].data[$base + $c | 0] = $u.$getEntry0($r, $c);
                $c = $c + 1 | 0;
            }
            $r = $r + 1 | 0;
        }
        return oajm_ComplexMatrix__init_($data);
    }
    $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($rt_s(66))).$append2($uDim)).$toString()));
},
oajm_ComplexMatrix_getEntry = ($this, $row, $column) => {
    let $flat, var$4, var$5;
    $flat = $rt_imul($row, $this.$cols) + $column | 0;
    var$4 = $this.$data1.data;
    var$5 = 2 * $flat | 0;
    return oajm_ComplexMatrix_box(var$4[var$5], $this.$data1.data[var$5 + 1 | 0]);
},
oajm_ComplexMatrix_getRowDimension = $this => {
    return $this.$rows;
},
oajm_ComplexMatrix_getColumnDimension = $this => {
    return $this.$cols;
},
oajm_ComplexMatrix_getData = $this => {
    let var$1, $out, $r, $c, var$5, $flat, var$7;
    var$1 = $this.$rows;
    $out = $rt_createMultiArray(oajm_Complex, [$this.$cols, var$1]);
    $r = 0;
    while ($r < $this.$rows) {
        $c = 0;
        while ($c < $this.$cols) {
            var$5 = $out.data;
            $flat = $rt_imul($r, $this.$cols) + $c | 0;
            var$7 = var$5[$r].data;
            var$5 = $this.$data1.data;
            var$1 = 2 * $flat | 0;
            var$7[$c] = oajm_ComplexMatrix_box(var$5[var$1], $this.$data1.data[var$1 + 1 | 0]);
            $c = $c + 1 | 0;
        }
        $r = $r + 1 | 0;
    }
    return $out;
},
oajm_ComplexMatrix_equals = ($this, $other) => {
    let $o, $i;
    if ($this === $other)
        return 1;
    if (!($other instanceof oajm_ComplexMatrix))
        return 0;
    $o = $other;
    if ($this.$rows == $o.$rows && $this.$cols == $o.$cols) {
        $i = 0;
        while ($i < $this.$data1.data.length) {
            if ($this.$data1.data[$i] !== $o.$data1.data[$i])
                return 0;
            $i = $i + 1 | 0;
        }
        return 1;
    }
    return 0;
},
oajm_ComplexMatrix_hashCode = $this => {
    let $result, var$2, var$3, var$4, $v, var$6;
    $result = (31 * $this.$rows | 0) + $this.$cols | 0;
    var$2 = $this.$data1.data;
    var$3 = var$2.length;
    var$4 = 0;
    while (var$4 < var$3) {
        $v = var$2[var$4];
        var$6 = 31 * $result | 0;
        if ($v === 0.0)
            $v = 0.0;
        $result = var$6 + jl_Double_hashCode($v) | 0;
        var$4 = var$4 + 1 | 0;
    }
    return $result;
},
oajm_ComplexMatrix_toString = $this => {
    let $sb, $r, $c;
    $sb = jl_StringBuilder__init_0($rt_s(67));
    $r = 0;
    while ($r < $this.$rows) {
        if ($r > 0)
            $sb.$append1($rt_s(57));
        $sb.$append0(91);
        $c = 0;
        while ($c < $this.$cols) {
            if ($c > 0)
                $sb.$append1($rt_s(57));
            $sb.$append($this.$getEntry0($r, $c));
            $c = $c + 1 | 0;
        }
        $sb.$append0(93);
        $r = $r + 1 | 0;
    }
    return ($sb.$append0(125)).$toString();
},
oajm_ComplexMatrix_box = ($re, $im) => {
    if ($re === 0.0 && $im === 0.0) {
        oajm_Complex_$callClinit();
        return oajm_Complex_ZERO;
    }
    if ($re === 1.0 && $im === 0.0) {
        oajm_Complex_$callClinit();
        return oajm_Complex_ONE;
    }
    return oajm_Complex__init_($re, $im);
},
oajvs_CircuitSpecJson = $rt_classWithoutFields(),
oajvs_CircuitSpecJson_fromJson = ($json, $config) => {
    let $tree;
    if (jl_String_length($json) <= 16777216) {
        $tree = oajvs_CircuitSpecJson$JsonParser_parse(oajvs_CircuitSpecJson$JsonParser__init_0($json));
        return oajvs_CircuitSpecJson_mapCircuit($tree, oaj_JQAPIConfig_maxQubits($config));
    }
    $rt_throw(jl_IllegalArgumentException__init_(((((jl_StringBuilder__init_()).$append1($rt_s(68))).$append2(jl_String_length($json))).$append1($rt_s(69))).$toString()));
},
oajvs_CircuitSpecJson_mapCircuit = ($tree, $maxQubits) => {
    let $root, $version, $numQubits, $levelsJson, $levels, $gateCount, var$9, $lo, $lm, $gatesJson, $gates, var$14, $go;
    $root = oajvs_CircuitSpecJson_asObject($tree, $rt_s(70));
    $version = oajvs_CircuitSpecJson_asInt($root.$get0($rt_s(71)), $rt_s(71));
    $numQubits = oajvs_CircuitSpecJson_asInt($root.$get0($rt_s(72)), $rt_s(72));
    if ($numQubits > 0 && $numQubits <= $maxQubits) {
        $levelsJson = oajvs_CircuitSpecJson_asArray($root.$get0($rt_s(73)), $rt_s(73));
        if ($levelsJson.$size() > 100000)
            $rt_throw(oaje_JQApiLimitException__init_($rt_s(74)));
        $levels = ju_ArrayList__init_0($levelsJson.$size());
        $gateCount = 0;
        var$9 = $levelsJson.$iterator();
        while (var$9.$hasNext()) {
            $lo = var$9.$next();
            $lm = oajvs_CircuitSpecJson_asObject($lo, $rt_s(75));
            $gatesJson = oajvs_CircuitSpecJson_asArray($lm.$get0($rt_s(76)), $rt_s(76));
            $gates = ju_ArrayList__init_0($gatesJson.$size());
            var$14 = $gatesJson.$iterator();
            while (var$14.$hasNext()) {
                $go = var$14.$next();
                $gateCount = $gateCount + 1 | 0;
                if ($gateCount > 100000)
                    $rt_throw(oaje_JQApiLimitException__init_($rt_s(77)));
                $gates.$add(oajvs_CircuitSpecJson_mapGate($go, $numQubits));
            }
            $levels.$add(oajvs_LevelSpec__init_0($gates));
        }
        return oajvs_CircuitSpec__init_0($version, $numQubits, $levels);
    }
    $rt_throw(oaje_JQApiLimitException__init_((((((jl_StringBuilder__init_()).$append1($rt_s(78))).$append2($maxQubits)).$append1($rt_s(79))).$append2($numQubits)).$toString()));
},
oajvs_CircuitSpecJson_mapGate = ($go, $numQubits) => {
    let $gm, $kind, $targets, $controls, var$7, $params, $matrix, $c, $$je;
    $gm = oajvs_CircuitSpecJson_asObject($go, $rt_s(80));
    a: {
        try {
            $kind = oajvs_GateKind_valueOf(oajvs_CircuitSpecJson_asString($gm.$get0($rt_s(81)), $rt_s(81)));
            break a;
        } catch ($$e) {
            $$je = $rt_wrapException($$e);
            if ($$je instanceof jl_IllegalArgumentException) {
            } else {
                throw $$e;
            }
        }
        $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($rt_s(82))).$append($gm.$get0($rt_s(81)))).$toString()));
    }
    $targets = oajvs_CircuitSpecJson_mapIndexes($gm.$get0($rt_s(83)), $numQubits, $rt_s(83));
    $controls = oajvs_CircuitSpecJson_mapIndexes($gm.$get0($rt_s(84)), $numQubits, $rt_s(84));
    var$7 = $controls.$iterator();
    while (true) {
        if (!var$7.$hasNext()) {
            $params = oajvs_CircuitSpecJson_mapParams($gm.$get0($rt_s(85)));
            $matrix = oajvs_CircuitSpecJson_mapMatrix($gm.$get0($rt_s(86)), $targets.$size());
            return oajvs_GateSpec__init_0($kind, $targets, $controls, $params, $matrix);
        }
        $c = (var$7.$next()).$intValue();
        if ($targets.$contains(jl_Integer_valueOf($c)))
            break;
    }
    $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($rt_s(87))).$append2($c)).$toString()));
},
oajvs_CircuitSpecJson_mapIndexes = ($o, $numQubits, $field) => {
    let $arr, $out, $seen, var$7, $x, $idx;
    $arr = oajvs_CircuitSpecJson_asArray($o, $field);
    $out = ju_ArrayList__init_0($arr.$size());
    $seen = ju_HashSet__init_1();
    var$7 = $arr.$iterator();
    a: {
        while (var$7.$hasNext()) {
            $x = var$7.$next();
            $idx = oajvs_CircuitSpecJson_asInt($x, (((jl_StringBuilder__init_()).$append1($field)).$append1($rt_s(88))).$toString());
            if ($idx < 0)
                break a;
            if ($idx >= $numQubits)
                break a;
            if (!$seen.$add(jl_Integer_valueOf($idx)))
                $rt_throw(jl_IllegalArgumentException__init_((((((jl_StringBuilder__init_()).$append1($rt_s(89))).$append1($field)).$append1($rt_s(90))).$append2($idx)).$toString()));
            $out.$add(jl_Integer_valueOf($idx));
        }
        return $out;
    }
    $rt_throw(oaje_JQApiLimitException__init_(((((((jl_StringBuilder__init_()).$append1($field)).$append1($rt_s(91))).$append2($numQubits)).$append1($rt_s(79))).$append2($idx)).$toString()));
},
oajvs_CircuitSpecJson_mapParams = $o => {
    let $pm, $out, var$4, $e;
    if ($o === null)
        return ju_Map_of();
    $pm = oajvs_CircuitSpecJson_asObject($o, $rt_s(85));
    $out = ju_LinkedHashMap__init_();
    var$4 = ($pm.$entrySet()).$iterator();
    while (var$4.$hasNext()) {
        $e = var$4.$next();
        $out.$put($e.$getKey(), jl_Double_valueOf(oajvs_CircuitSpecJson_asDouble($e.$getValue(), (((jl_StringBuilder__init_()).$append1($rt_s(92))).$append1($e.$getKey())).$toString())));
    }
    return $out;
},
oajvs_CircuitSpecJson_mapMatrix = ($o, $numTargets) => {
    let $rows, $expected, var$5, var$6, $out, $ro, $cols, $row, var$11, $co, $cell;
    if ($o === null)
        return null;
    if ($numTargets > 30)
        $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($rt_s(93))).$append2($numTargets)).$toString()));
    $rows = oajvs_CircuitSpecJson_asArray($o, $rt_s(86));
    $expected = 1 << $numTargets;
    if ($rows.$size() != $expected) {
        var$5 = new jl_IllegalArgumentException;
        var$6 = (((((jl_StringBuilder__init_()).$append1($rt_s(94))).$append2($expected)).$append1($rt_s(95))).$append2($expected)).$append1($rt_s(96));
        jl_IllegalArgumentException__init_1(var$5, ((var$6.$append2($rows.$size())).$append1($rt_s(97))).$toString());
        $rt_throw(var$5);
    }
    $out = ju_ArrayList__init_0($rows.$size());
    var$6 = $rows.$iterator();
    while (var$6.$hasNext()) {
        $ro = var$6.$next();
        $cols = oajvs_CircuitSpecJson_asArray($ro, $rt_s(98));
        if ($cols.$size() != $expected) {
            var$5 = new jl_IllegalArgumentException;
            var$6 = (((jl_StringBuilder__init_()).$append1($rt_s(99))).$append2($expected)).$append1($rt_s(100));
            jl_IllegalArgumentException__init_1(var$5, (var$6.$append2($cols.$size())).$toString());
            $rt_throw(var$5);
        }
        $row = ju_ArrayList__init_0($cols.$size());
        var$11 = $cols.$iterator();
        while (var$11.$hasNext()) {
            $co = var$11.$next();
            $cell = oajvs_CircuitSpecJson_asObject($co, $rt_s(101));
            $row.$add(oajvs_ComplexCell__init_0(oajvs_CircuitSpecJson_asDouble($cell.$get0($rt_s(102)), $rt_s(102)), oajvs_CircuitSpecJson_asDouble($cell.$get0($rt_s(103)), $rt_s(103))));
        }
        $out.$add($row);
    }
    return $out;
},
oajvs_CircuitSpecJson_asObject = ($o, $what) => {
    let $m;
    if ($rt_isInstance($o, ju_Map)) {
        $m = $o;
        return $m;
    }
    $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($what)).$append1($rt_s(104))).$toString()));
},
oajvs_CircuitSpecJson_asArray = ($o, $what) => {
    let $l;
    if ($rt_isInstance($o, ju_List)) {
        $l = $o;
        return $l;
    }
    $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($what)).$append1($rt_s(105))).$toString()));
},
oajvs_CircuitSpecJson_asString = ($o, $what) => {
    let $s;
    if ($o instanceof jl_String) {
        $s = $o;
        return $s;
    }
    $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($what)).$append1($rt_s(106))).$toString()));
},
oajvs_CircuitSpecJson_asDouble = ($o, $what) => {
    let $d;
    if (!($o instanceof jl_Double))
        $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($what)).$append1($rt_s(107))).$toString()));
    $d = $o;
    if (isFinite($d.$doubleValue()) ? 1 : 0)
        return $d.$doubleValue();
    $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($what)).$append1($rt_s(108))).$toString()));
},
oajvs_CircuitSpecJson_asInt = ($o, $what) => {
    let $d;
    $d = oajvs_CircuitSpecJson_asDouble($o, $what);
    if ($d === jl_Math_rint($d) && !(jl_Math_abs1($d) > 2.147483647E9))
        return $d | 0;
    $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($what)).$append1($rt_s(109))).$toString()));
};
function oajqs_SamplingResult() {
    let a = this; jl_Object.call(a);
    a.$shots1 = 0;
    a.$measuredQubits0 = null;
    a.$counts0 = null;
}
let oajqs_SamplingResult__init_ = ($this, $shots, $measuredQubits, $counts) => {
    jl_Object__init_($this);
    $this.$shots1 = $shots;
    $this.$measuredQubits0 = $measuredQubits.$clone0();
    $this.$counts0 = $counts.$clone0();
},
oajqs_SamplingResult__init_0 = (var_0, var_1, var_2) => {
    let var_3 = new oajqs_SamplingResult();
    oajqs_SamplingResult__init_(var_3, var_0, var_1, var_2);
    return var_3;
},
oajqs_SamplingResult_counts = $this => {
    return $this.$counts0.$clone0();
},
juf_IntFunction = $rt_classWithoutFields(0),
ju_TemplateCollections$AbstractImmutableMap = $rt_classWithoutFields(ju_AbstractMap),
ju_TemplateCollections$AbstractImmutableMap__init_ = $this => {
    ju_AbstractMap__init_($this);
};
function ju_TemplateCollections$NEtriesMap() {
    let a = this; ju_TemplateCollections$AbstractImmutableMap.call(a);
    a.$data = null;
    a.$entrySet0 = null;
}
let ju_TemplateCollections$NEtriesMap__init_ = ($this, $data) => {
    ju_TemplateCollections$AbstractImmutableMap__init_($this);
    $this.$data = ju_TemplateCollections$NEtriesMap_toEntryArray($this, $data);
},
ju_TemplateCollections$NEtriesMap__init_2 = var_0 => {
    let var_1 = new ju_TemplateCollections$NEtriesMap();
    ju_TemplateCollections$NEtriesMap__init_(var_1, var_0);
    return var_1;
},
ju_TemplateCollections$NEtriesMap__init_0 = ($this, $map) => {
    ju_TemplateCollections$AbstractImmutableMap__init_($this);
    $this.$data = ju_TemplateCollections$NEtriesMap_toEntryArray($this, ($map.$entrySet()).$toArray($rt_createArray(ju_Map$Entry, 0)));
},
ju_TemplateCollections$NEtriesMap__init_1 = var_0 => {
    let var_1 = new ju_TemplateCollections$NEtriesMap();
    ju_TemplateCollections$NEtriesMap__init_0(var_1, var_0);
    return var_1;
},
ju_TemplateCollections$NEtriesMap_toEntryArray = ($this, $entries) => {
    let var$2, var$3, $table, var$5, $entry, $suggestedIndex, $found, var$9, $existingEntry, $existingElement;
    var$2 = $entries.data;
    var$3 = var$2.length;
    $table = $rt_createArray(ju_Map$Entry, var$3);
    ju_Arrays_fill3($table, null);
    var$5 = 0;
    while (var$5 < var$3) {
        $entry = var$2[var$5];
        ju_Objects_requireNonNull0($entry.$getKey());
        ju_Objects_requireNonNull0($entry.$getValue());
        $suggestedIndex = jl_Math_abs(($entry.$getKey()).$hashCode1()) % var$3 | 0;
        $found = 0;
        var$9 = $suggestedIndex;
        a: {
            while (var$9 < var$3) {
                $existingEntry = $table.data[var$9];
                if ($existingEntry === null) {
                    $found = 1;
                    break a;
                }
                if (($existingEntry.$getKey()).$equals0($entry.$getKey()))
                    $rt_throw(jl_IllegalArgumentException__init_0());
                var$9 = var$9 + 1 | 0;
            }
        }
        b: {
            if (!$found) {
                var$9 = 0;
                while (var$9 < $suggestedIndex) {
                    $existingElement = $table.data[var$9];
                    if ($existingElement === null)
                        break b;
                    if (($existingElement.$getKey()).$equals0($entry.$getKey()))
                        $rt_throw(jl_IllegalArgumentException__init_0());
                    var$9 = var$9 + 1 | 0;
                }
            }
        }
        $table.data[var$9] = ju_TemplateCollections$ImmutableEntry__init_0($entry.$getKey(), $entry.$getValue());
        var$5 = var$5 + 1 | 0;
    }
    return $table;
},
ju_TemplateCollections$NEtriesMap_size = $this => {
    return $this.$data.data.length;
},
ju_TemplateCollections$NEtriesMap_containsKey = ($this, $key) => {
    let $suggestedIndex, $i;
    if ($key !== null && $this.$data.data.length) {
        $suggestedIndex = jl_Math_abs($key.$hashCode1()) % $this.$data.data.length | 0;
        $i = $suggestedIndex;
        while (true) {
            if ($i >= $this.$data.data.length) {
                $i = 0;
                while ($i < $suggestedIndex) {
                    if (($this.$data.data[$i].$getKey()).$equals0($key))
                        return 1;
                    $i = $i + 1 | 0;
                }
                return 0;
            }
            if (($this.$data.data[$i].$getKey()).$equals0($key))
                break;
            $i = $i + 1 | 0;
        }
        return 1;
    }
    return 0;
},
ju_TemplateCollections$NEtriesMap_get = ($this, $key) => {
    let $suggestedIndex, $i, $entry;
    if ($key === null)
        return null;
    $suggestedIndex = jl_Math_abs($key.$hashCode1()) % $this.$data.data.length | 0;
    $i = $suggestedIndex;
    while (true) {
        if ($i >= $this.$data.data.length) {
            $i = 0;
            while ($i < $suggestedIndex) {
                $entry = $this.$data.data[$i];
                if (($entry.$getKey()).$equals0($key))
                    return $entry.$getValue();
                $i = $i + 1 | 0;
            }
            return null;
        }
        $entry = $this.$data.data[$i];
        if (($entry.$getKey()).$equals0($key))
            break;
        $i = $i + 1 | 0;
    }
    return $entry.$getValue();
},
ju_TemplateCollections$NEtriesMap_entrySet = $this => {
    if ($this.$entrySet0 === null)
        $this.$entrySet0 = ju_TemplateCollections$NEtriesMap$1__init_0($this);
    return $this.$entrySet0;
};
function ju_HashMap$HashEntry() {
    let a = this; ju_MapEntry.call(a);
    a.$origKeyHash = 0;
    a.$next4 = null;
}
let ju_HashMap$HashEntry__init_ = ($this, $theKey, $hash) => {
    ju_MapEntry__init_($this, $theKey, null);
    $this.$origKeyHash = $hash;
},
ju_HashMap$HashEntry__init_0 = (var_0, var_1) => {
    let var_2 = new ju_HashMap$HashEntry();
    ju_HashMap$HashEntry__init_(var_2, var_0, var_1);
    return var_2;
};
function ju_LinkedHashMap$LinkedHashMapEntry() {
    let a = this; ju_HashMap$HashEntry.call(a);
    a.$chainForward = null;
    a.$chainBackward = null;
}
let ju_LinkedHashMap$LinkedHashMapEntry__init_ = ($this, $theKey, $hash) => {
    ju_HashMap$HashEntry__init_($this, $theKey, $hash);
    $this.$chainForward = null;
    $this.$chainBackward = null;
},
ju_LinkedHashMap$LinkedHashMapEntry__init_0 = (var_0, var_1) => {
    let var_2 = new ju_LinkedHashMap$LinkedHashMapEntry();
    ju_LinkedHashMap$LinkedHashMapEntry__init_(var_2, var_0, var_1);
    return var_2;
},
jl_IllegalArgumentException = $rt_classWithoutFields(jl_RuntimeException),
jl_IllegalArgumentException__init_2 = $this => {
    jl_RuntimeException__init_($this);
},
jl_IllegalArgumentException__init_0 = () => {
    let var_0 = new jl_IllegalArgumentException();
    jl_IllegalArgumentException__init_2(var_0);
    return var_0;
},
jl_IllegalArgumentException__init_1 = ($this, $message) => {
    jl_RuntimeException__init_0($this, $message);
},
jl_IllegalArgumentException__init_ = var_0 => {
    let var_1 = new jl_IllegalArgumentException();
    jl_IllegalArgumentException__init_1(var_1, var_0);
    return var_1;
},
oaje_JQApiLimitException = $rt_classWithoutFields(jl_IllegalArgumentException),
oaje_JQApiLimitException__init_0 = ($this, $message) => {
    jl_IllegalArgumentException__init_1($this, $message);
},
oaje_JQApiLimitException__init_ = var_0 => {
    let var_1 = new oaje_JQApiLimitException();
    oaje_JQApiLimitException__init_0(var_1, var_0);
    return var_1;
};
function jl_Enum() {
    let a = this; jl_Object.call(a);
    a.$name0 = null;
    a.$ordinal0 = 0;
}
let jl_Enum__init_ = ($this, $name, $ordinal) => {
    jl_Object__init_($this);
    $this.$name0 = $name;
    $this.$ordinal0 = $ordinal;
},
jl_Enum_name = $this => {
    return $this.$name0;
},
jl_Enum_ordinal = $this => {
    return $this.$ordinal0;
},
jl_Enum_toString = $this => {
    return jl_String_toString($this.$name0);
},
jl_Enum_equals = ($this, $other) => {
    return $this !== $other ? 0 : 1;
},
jl_Enum_hashCode = $this => {
    return jl_Object_hashCode($this);
},
jl_Enum_valueOf = ($enumType, $name) => {
    let $constants, var$4, var$5, var$6, var$7, var$8, var$9, var$10, $constant;
    $constants = jl_Class_getEnumConstants($enumType);
    if ($constants === null)
        $rt_throw(jl_IllegalArgumentException__init_($rt_s(110)));
    var$4 = $constants.data;
    var$5 = var$4.length;
    var$6 = 0;
    while (true) {
        if (var$6 >= var$5) {
            var$7 = new jl_IllegalArgumentException;
            var$8 = jl_String_valueOf($enumType);
            var$9 = jl_String_valueOf($name);
            var$10 = jl_StringBuilder__init_();
            jl_StringBuilder_append(jl_StringBuilder_append(jl_StringBuilder_append(jl_StringBuilder_append(jl_StringBuilder_append(var$10, $rt_s(111)), var$8), $rt_s(112)), var$9), $rt_s(113));
            jl_IllegalArgumentException__init_1(var$7, jl_StringBuilder_toString(var$10));
            $rt_throw(var$7);
        }
        $constant = var$4[var$6];
        if (jl_String_equals(jl_Enum_name($constant), $name))
            break;
        var$6 = var$6 + 1 | 0;
    }
    return $constant;
},
jus_Collector$Characteristics = $rt_classWithoutFields(jl_Enum),
jus_Collector$Characteristics_CONCURRENT = null,
jus_Collector$Characteristics_UNORDERED = null,
jus_Collector$Characteristics_IDENTITY_FINISH = null,
jus_Collector$Characteristics_$VALUES = null,
jus_Collector$Characteristics_$callClinit = () => {
    jus_Collector$Characteristics_$callClinit = $rt_eraseClinit(jus_Collector$Characteristics);
    jus_Collector$Characteristics__clinit_();
},
jus_Collector$Characteristics__init_0 = ($this, var$1, var$2) => {
    jus_Collector$Characteristics_$callClinit();
    jl_Enum__init_($this, var$1, var$2);
},
jus_Collector$Characteristics__init_ = (var_0, var_1) => {
    let var_2 = new jus_Collector$Characteristics();
    jus_Collector$Characteristics__init_0(var_2, var_0, var_1);
    return var_2;
},
jus_Collector$Characteristics_$values = () => {
    let var$1, var$2;
    jus_Collector$Characteristics_$callClinit();
    var$1 = $rt_createArray(jus_Collector$Characteristics, 3);
    var$2 = var$1.data;
    var$2[0] = jus_Collector$Characteristics_CONCURRENT;
    var$2[1] = jus_Collector$Characteristics_UNORDERED;
    var$2[2] = jus_Collector$Characteristics_IDENTITY_FINISH;
    return var$1;
},
jus_Collector$Characteristics__clinit_ = () => {
    jus_Collector$Characteristics_CONCURRENT = jus_Collector$Characteristics__init_($rt_s(114), 0);
    jus_Collector$Characteristics_UNORDERED = jus_Collector$Characteristics__init_($rt_s(115), 1);
    jus_Collector$Characteristics_IDENTITY_FINISH = jus_Collector$Characteristics__init_($rt_s(116), 2);
    jus_Collector$Characteristics_$VALUES = jus_Collector$Characteristics_$values();
};
function oajm_ComplexVector() {
    jl_Object.call(this);
    this.$data0 = null;
}
let oajm_ComplexVector__init_0 = ($this, $size) => {
    jl_Object__init_($this);
    $this.$data0 = $rt_createDoubleArray($size * 2 | 0);
},
oajm_ComplexVector__init_1 = var_0 => {
    let var_1 = new oajm_ComplexVector();
    oajm_ComplexVector__init_0(var_1, var_0);
    return var_1;
},
oajm_ComplexVector__init_ = ($this, $values) => {
    let var$2, var$3, $i, var$5, var$6;
    var$2 = $values.data;
    jl_Object__init_($this);
    var$3 = var$2.length;
    $this.$data0 = $rt_createDoubleArray(var$3 * 2 | 0);
    $i = 0;
    while ($i < var$3) {
        var$5 = $this.$data0.data;
        var$6 = 2 * $i | 0;
        var$5[var$6] = oajm_Complex_getReal(var$2[$i]);
        $this.$data0.data[var$6 + 1 | 0] = oajm_Complex_getImaginary(var$2[$i]);
        $i = $i + 1 | 0;
    }
},
oajm_ComplexVector__init_2 = var_0 => {
    let var_1 = new oajm_ComplexVector();
    oajm_ComplexVector__init_(var_1, var_0);
    return var_1;
},
oajm_ComplexVector_getEntry = ($this, $index) => {
    let var$2, var$3;
    var$2 = $this.$data0.data;
    var$3 = 2 * $index | 0;
    return oajm_ComplexVector_box(var$2[var$3], $this.$data0.data[var$3 + 1 | 0]);
},
oajm_ComplexVector_setEntry = ($this, $index, $value) => {
    let var$3, var$4;
    var$3 = $this.$data0.data;
    var$4 = 2 * $index | 0;
    var$3[var$4] = oajm_Complex_getReal($value);
    $this.$data0.data[var$4 + 1 | 0] = oajm_Complex_getImaginary($value);
},
oajm_ComplexVector_getDimension = $this => {
    return $this.$data0.data.length / 2 | 0;
},
oajm_ComplexVector_getData = $this => {
    let $dimension, $out, $i, var$4, var$5, var$6;
    $dimension = $this.$getDimension();
    $out = $rt_createArray(oajm_Complex, $dimension);
    $i = 0;
    while ($i < $dimension) {
        var$4 = $out.data;
        var$5 = $this.$data0.data;
        var$6 = 2 * $i | 0;
        var$4[$i] = oajm_ComplexVector_box(var$5[var$6], $this.$data0.data[var$6 + 1 | 0]);
        $i = $i + 1 | 0;
    }
    return $out;
},
oajm_ComplexVector_outerProduct = ($this, $vector) => {
    let $rows, $cols, $product, $r, $left, $c;
    $rows = $this.$getDimension();
    $cols = $vector.$getDimension();
    $product = $rt_createMultiArray(oajm_Complex, [$cols, $rows]);
    $r = 0;
    while ($r < $rows) {
        $left = $this.$getEntry($r);
        $c = 0;
        while ($c < $cols) {
            $product.data[$r].data[$c] = oajm_Complex_multiply0($left, $vector.$getEntry($c));
            $c = $c + 1 | 0;
        }
        $r = $r + 1 | 0;
    }
    return oajm_ComplexMatrix_createMatrixWithData($product);
},
oajm_ComplexVector_tensorProduct = ($this, $vector) => {
    let $outer, $rows, $cols, $output, $c, $r;
    $outer = $this.$outerProduct($vector);
    $rows = $this.$getDimension();
    $cols = $vector.$getDimension();
    $output = oajm_ComplexVector__init_1($rt_imul($rows, $cols));
    $c = 0;
    while ($c < $cols) {
        $r = 0;
        while ($r < $rows) {
            $output.$setEntry($rt_imul($c, $rows) + $r | 0, $outer.$getEntry0($r, $c));
            $r = $r + 1 | 0;
        }
        $c = $c + 1 | 0;
    }
    return $output;
},
oajm_ComplexVector_box = ($re, $im) => {
    if ($re === 0.0 && $im === 0.0) {
        oajm_Complex_$callClinit();
        return oajm_Complex_ZERO;
    }
    if ($re === 1.0 && $im === 0.0) {
        oajm_Complex_$callClinit();
        return oajm_Complex_ONE;
    }
    return oajm_Complex__init_($re, $im);
};
function ju_AbstractList$1() {
    let a = this; jl_Object.call(a);
    a.$index1 = 0;
    a.$modCount1 = 0;
    a.$size2 = 0;
    a.$removeIndex = 0;
    a.$this$0 = null;
}
let ju_AbstractList$1__init_ = ($this, $this$0) => {
    $this.$this$0 = $this$0;
    jl_Object__init_($this);
    $this.$modCount1 = $this.$this$0.$modCount0;
    $this.$size2 = $this.$this$0.$size();
    $this.$removeIndex = (-1);
},
ju_AbstractList$1__init_0 = var_0 => {
    let var_1 = new ju_AbstractList$1();
    ju_AbstractList$1__init_(var_1, var_0);
    return var_1;
},
ju_AbstractList$1_hasNext = $this => {
    return $this.$index1 >= $this.$size2 ? 0 : 1;
},
ju_AbstractList$1_next = $this => {
    let var$1, var$2;
    ju_AbstractList$1_checkConcurrentModification($this);
    $this.$removeIndex = $this.$index1;
    var$1 = $this.$this$0;
    var$2 = $this.$index1;
    $this.$index1 = var$2 + 1 | 0;
    return var$1.$get(var$2);
},
ju_AbstractList$1_checkConcurrentModification = $this => {
    if ($this.$modCount1 == $this.$this$0.$modCount0)
        return;
    $rt_throw(ju_ConcurrentModificationException__init_());
},
otj_JSObject = $rt_classWithoutFields(0),
otjc_Crypto = $rt_classWithoutFields();
function oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0() {
    jl_Object.call(this);
    this.$_024 = null;
}
let oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_024 = var$1;
},
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0__init_0 = var_0 => {
    let var_1 = new oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0();
    oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0__init_(var_1, var_0);
    return var_1;
},
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0_accept0 = (var$0, var$1) => {
    oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0_accept(var$0, var$1);
},
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0_accept = (var$0, var$1) => {
    oajq_QuantumRegister_lambda$resetQubitAtIndexes$0(var$0.$_024, var$1);
};
function oaj_JQAPIConfig() {
    let a = this; jl_Object.call(a);
    a.$maxQubits0 = 0;
    a.$maxSearchQubits = 0;
    a.$parallelEnabled0 = 0;
    a.$parallelThreshold0 = 0;
    a.$operatorExecutor0 = null;
}
let oaj_JQAPIConfig_RESOLVED_PARALLEL_ENABLED = 0,
oaj_JQAPIConfig_RESOLVED_PARALLEL_THRESHOLD = 0,
oaj_JQAPIConfig_$callClinit = () => {
    oaj_JQAPIConfig_$callClinit = $rt_eraseClinit(oaj_JQAPIConfig);
    oaj_JQAPIConfig__clinit_();
},
oaj_JQAPIConfig__init_0 = ($this, $maxQubits, $maxSearchQubits, $parallelEnabled, $parallelThreshold, $operatorExecutor) => {
    oaj_JQAPIConfig_$callClinit();
    jl_Object__init_($this);
    if ($maxQubits <= 0)
        $rt_throw(oaje_JQApiLimitException__init_((((jl_StringBuilder__init_()).$append1($rt_s(117))).$append2($maxQubits)).$toString()));
    if ($maxQubits > 30)
        $rt_throw(oaje_JQApiLimitException__init_((((jl_StringBuilder__init_()).$append1($rt_s(118))).$append2($maxQubits)).$toString()));
    if ($maxSearchQubits <= 0)
        $rt_throw(oaje_JQApiLimitException__init_((((jl_StringBuilder__init_()).$append1($rt_s(119))).$append2($maxSearchQubits)).$toString()));
    if ($maxSearchQubits > 30)
        $rt_throw(oaje_JQApiLimitException__init_((((jl_StringBuilder__init_()).$append1($rt_s(120))).$append2($maxSearchQubits)).$toString()));
    if ($parallelThreshold >= 1) {
        $this.$maxQubits0 = $maxQubits;
        $this.$maxSearchQubits = $maxSearchQubits;
        $this.$parallelEnabled0 = $parallelEnabled;
        $this.$parallelThreshold0 = $parallelThreshold;
        $this.$operatorExecutor0 = $operatorExecutor;
        return;
    }
    $rt_throw(oaje_JQApiLimitException__init_((((jl_StringBuilder__init_()).$append1($rt_s(121))).$append2($parallelThreshold)).$toString()));
},
oaj_JQAPIConfig__init_ = (var_0, var_1, var_2, var_3, var_4) => {
    let var_5 = new oaj_JQAPIConfig();
    oaj_JQAPIConfig__init_0(var_5, var_0, var_1, var_2, var_3, var_4);
    return var_5;
},
oaj_JQAPIConfig_sequential = $maxQubits => {
    oaj_JQAPIConfig_$callClinit();
    return oaj_JQAPIConfig__init_($maxQubits, 12, 0, 65536, oajq_SequentialOperatorExecutor__init_0());
},
oaj_JQAPIConfig_readBooleanProperty = ($property, $fallback) => {
    let $value;
    oaj_JQAPIConfig_$callClinit();
    $value = jl_System_getProperty($property);
    if ($value !== null)
        $fallback = jl_Boolean_parseBoolean($value);
    return $fallback;
},
oaj_JQAPIConfig_readThresholdProperty = ($property, $fallback) => {
    let $value;
    oaj_JQAPIConfig_$callClinit();
    $value = (jl_Integer_getInteger0($property, $fallback)).$intValue();
    if ($value >= 1)
        $fallback = $value;
    return $fallback;
},
oaj_JQAPIConfig_maxQubits = $this => {
    return $this.$maxQubits0;
},
oaj_JQAPIConfig_parallelEnabled = $this => {
    return $this.$parallelEnabled0;
},
oaj_JQAPIConfig_parallelThreshold = $this => {
    return $this.$parallelThreshold0;
},
oaj_JQAPIConfig_operatorExecutor = $this => {
    return $this.$operatorExecutor0;
},
oaj_JQAPIConfig__clinit_ = () => {
    oaj_JQAPIConfig_RESOLVED_PARALLEL_ENABLED = oaj_JQAPIConfig_readBooleanProperty($rt_s(122), 1);
    oaj_JQAPIConfig_RESOLVED_PARALLEL_THRESHOLD = oaj_JQAPIConfig_readThresholdProperty($rt_s(123), 65536);
};
function oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1() {
    jl_Object.call(this);
    this.$_06 = null;
}
let oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_06 = var$1;
},
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1__init_0 = var_0 => {
    let var_1 = new oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1();
    oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1__init_(var_1, var_0);
    return var_1;
},
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1_accept0 = (var$0, var$1) => {
    oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1_accept(var$0, var$1);
},
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1_accept = (var$0, var$1) => {
    var$0.$_06.$reset(var$1.$intValue());
};
function ju_TemplateCollections$NEtriesMap$1$1() {
    let a = this; jl_Object.call(a);
    a.$index = 0;
    a.$this$1 = null;
}
let ju_TemplateCollections$NEtriesMap$1$1__init_ = ($this, $this$1) => {
    $this.$this$1 = $this$1;
    jl_Object__init_($this);
},
ju_TemplateCollections$NEtriesMap$1$1__init_0 = var_0 => {
    let var_1 = new ju_TemplateCollections$NEtriesMap$1$1();
    ju_TemplateCollections$NEtriesMap$1$1__init_(var_1, var_0);
    return var_1;
},
ju_TemplateCollections$NEtriesMap$1$1_hasNext = $this => {
    return $this.$index >= $this.$this$1.$this$00.$data.data.length ? 0 : 1;
},
ju_TemplateCollections$NEtriesMap$1$1_next = $this => {
    let var$1, var$2;
    if ($this.$index == $this.$this$1.$this$00.$data.data.length)
        $rt_throw(ju_NoSuchElementException__init_());
    var$1 = $this.$this$1.$this$00.$data.data;
    var$2 = $this.$index;
    $this.$index = var$2 + 1 | 0;
    return var$1[var$2];
},
ju_TemplateCollections$NEtriesMap$1$1_next0 = $this => {
    return $this.$next1();
},
jlr_Array = $rt_classWithoutFields(),
jlr_Array_getLength = $array => {
    let $cls;
    $cls = jl_Class_getClassInfo(jl_Object_getClass($array));
    if ($cls[$rt_meta].itemType !== null)
        return $rt_arrayLength($array);
    $rt_throw(jl_IllegalArgumentException__init_0());
},
jlr_Array_newInstance = ($componentType, $length) => {
    let $cls;
    if ($componentType === null)
        $rt_throw(jl_NullPointerException__init_());
    if ($componentType === $rt_cls($rt_voidcls))
        $rt_throw(jl_IllegalArgumentException__init_0());
    if ($length < 0)
        $rt_throw(jl_NegativeArraySizeException__init_0());
    $cls = jl_Class_getClassInfo($componentType);
    return otrr_ClassInfo_newArrayInstance($cls, $length);
};
function jusi_StreamOverSpliterator$AdapterAction() {
    let a = this; jl_Object.call(a);
    a.$consumer = null;
    a.$wantsMore = 0;
}
let jusi_StreamOverSpliterator$AdapterAction__init_ = ($this, $consumer) => {
    jl_Object__init_($this);
    $this.$consumer = $consumer;
},
jusi_StreamOverSpliterator$AdapterAction__init_0 = var_0 => {
    let var_1 = new jusi_StreamOverSpliterator$AdapterAction();
    jusi_StreamOverSpliterator$AdapterAction__init_(var_1, var_0);
    return var_1;
},
jusi_StreamOverSpliterator$AdapterAction_accept = ($this, $t) => {
    $this.$wantsMore = $this.$consumer.$test1($t);
},
ju_ListIterator = $rt_classWithoutFields(0);
function jus_CollectorImpl() {
    let a = this; jl_Object.call(a);
    a.$supplier0 = null;
    a.$accumulator0 = null;
    a.$combiner = null;
    a.$finisher0 = null;
    a.$characteristics = null;
}
let jus_CollectorImpl__init_ = ($this, $supplier, $accumulator, $combiner, $finisher, $characteristics) => {
    jl_Object__init_($this);
    $this.$supplier0 = $supplier;
    $this.$accumulator0 = $accumulator;
    $this.$combiner = $combiner;
    $this.$finisher0 = $finisher;
    $this.$characteristics = $characteristics;
},
jus_CollectorImpl__init_0 = (var_0, var_1, var_2, var_3, var_4) => {
    let var_5 = new jus_CollectorImpl();
    jus_CollectorImpl__init_(var_5, var_0, var_1, var_2, var_3, var_4);
    return var_5;
},
jus_CollectorImpl_supplier = $this => {
    return $this.$supplier0;
},
jus_CollectorImpl_accumulator = $this => {
    return $this.$accumulator0;
},
jus_CollectorImpl_finisher = $this => {
    return $this.$finisher0;
},
juf_BiFunction = $rt_classWithoutFields(0);
function otcit_DoubleAnalyzer$Result() {
    let a = this; jl_Object.call(a);
    a.$mantissa = Long_ZERO;
    a.$exponent = 0;
    a.$sign1 = 0;
}
let otcit_DoubleAnalyzer$Result__init_0 = $this => {
    jl_Object__init_($this);
},
otcit_DoubleAnalyzer$Result__init_ = () => {
    let var_0 = new otcit_DoubleAnalyzer$Result();
    otcit_DoubleAnalyzer$Result__init_0(var_0);
    return var_0;
};
function ju_Random() {
    jl_Object.call(this);
    this.$seed = Long_ZERO;
}
let ju_Random__init_ = $this => {
    ju_Random__init_0($this, Long_fromNumber(jl_Math_random() * 2.81474976710656E14 - 1.0));
},
ju_Random__init_2 = () => {
    let var_0 = new ju_Random();
    ju_Random__init_(var_0);
    return var_0;
},
ju_Random__init_0 = ($this, $seed) => {
    jl_Object__init_($this);
    $this.$setSeed($seed);
},
ju_Random__init_1 = var_0 => {
    let var_1 = new ju_Random();
    ju_Random__init_0(var_1, var_0);
    return var_1;
},
ju_Random_setSeed = ($this, $seed) => {
    $this.$seed = Long_and(Long_xor($seed, Long_create(3740067437, 5)), Long_create(4294967295, 65535));
};
function oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0() {
    jl_Object.call(this);
    this.$_011 = null;
}
let oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_011 = var$1;
},
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0__init_0 = var_0 => {
    let var_1 = new oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0();
    oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0__init_(var_1, var_0);
    return var_1;
},
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0_accept0 = (var$0, var$1) => {
    oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0_accept(var$0, var$1);
},
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0_accept = (var$0, var$1) => {
    oajq_QuantumRegister_lambda$measureQubitAtIndexes$0(var$0.$_011, var$1);
},
otpp_ResourceAccessor = $rt_classWithoutFields();
function oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1() {
    jl_Object.call(this);
    this.$_020 = null;
}
let oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_020 = var$1;
},
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1__init_0 = var_0 => {
    let var_1 = new oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1();
    oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1__init_(var_1, var_0);
    return var_1;
},
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1_accept0 = (var$0, var$1) => {
    oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1_accept(var$0, var$1);
},
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1_accept = (var$0, var$1) => {
    oajq_QuantumRegister_lambda$measureQubitAtIndexes$1(var$0.$_020, var$1);
};
function jusi_FilteringIntStreamImpl$wrap$lambda$_1_0() {
    let a = this; jl_Object.call(a);
    a.$_012 = null;
    a.$_12 = null;
}
let jusi_FilteringIntStreamImpl$wrap$lambda$_1_0__init_ = (var$0, var$1, var$2) => {
    jl_Object__init_(var$0);
    var$0.$_012 = var$1;
    var$0.$_12 = var$2;
},
jusi_FilteringIntStreamImpl$wrap$lambda$_1_0__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_FilteringIntStreamImpl$wrap$lambda$_1_0();
    jusi_FilteringIntStreamImpl$wrap$lambda$_1_0__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_FilteringIntStreamImpl$wrap$lambda$_1_0_test = (var$0, var$1) => {
    return jusi_FilteringIntStreamImpl_lambda$wrap$0(var$0.$_012, var$0.$_12, var$1);
},
otci_IntegerUtil = $rt_classWithoutFields(),
otci_IntegerUtil_toUnsignedLogRadixString = ($value, $radixLog2) => {
    let $radix, $mask, $sz, $chars, $pos, $target, var$9, $target_0;
    if (!$value)
        return $rt_s(124);
    $radix = 1 << $radixLog2;
    $mask = $radix - 1 | 0;
    $sz = (((32 - jl_Integer_numberOfLeadingZeros($value) | 0) + $radixLog2 | 0) - 1 | 0) / $radixLog2 | 0;
    $chars = $rt_createCharArray($sz);
    $pos = $rt_imul($sz - 1 | 0, $radixLog2);
    $target = 0;
    while ($pos >= 0) {
        var$9 = $chars.data;
        $target_0 = $target + 1 | 0;
        var$9[$target] = jl_Character_forDigit(($value >>> $pos | 0) & $mask, $radix);
        $pos = $pos - $radixLog2 | 0;
        $target = $target_0;
    }
    return jl_String__init_5($chars);
},
jl_Thread$UncaughtExceptionHandler = $rt_classWithoutFields(0),
jl_DefaultUncaughtExceptionHandler = $rt_classWithoutFields(),
jl_DefaultUncaughtExceptionHandler__init_ = $this => {
    jl_Object__init_($this);
},
jl_DefaultUncaughtExceptionHandler__init_0 = () => {
    let var_0 = new jl_DefaultUncaughtExceptionHandler();
    jl_DefaultUncaughtExceptionHandler__init_(var_0);
    return var_0;
},
otji_JS = $rt_classWithoutFields(),
otp_PlatformRunnable = $rt_classWithoutFields(0),
oajq_OperatorExecutor = $rt_classWithoutFields(0),
oajq_SequentialOperatorExecutor = $rt_classWithoutFields(),
oajq_SequentialOperatorExecutor__init_ = $this => {
    jl_Object__init_($this);
},
oajq_SequentialOperatorExecutor__init_0 = () => {
    let var_0 = new oajq_SequentialOperatorExecutor();
    oajq_SequentialOperatorExecutor__init_(var_0);
    return var_0;
},
oajq_SequentialOperatorExecutor_applyGroups = ($this, $dimension, $targetMask, $groupApplier) => {
    let $base;
    $base = 0;
    while ($base < $dimension) {
        if (!($base & $targetMask))
            $groupApplier.$accept3($base);
        $base = $base + 1 | 0;
    }
},
otciu_UnicodeHelper = $rt_classWithoutFields(),
otciu_UnicodeHelper_decodeCaseMapping = $text => {
    let $flow, $sz, $data, $last, $i, var$7, var$8;
    $flow = otci_CharFlow__init_0(jl_String_toCharArray($text));
    $sz = otci_Base46_decodeUnsigned($flow);
    $data = $rt_createIntArray($sz * 2 | 0);
    $last = 0;
    $i = 0;
    while ($i < $sz) {
        var$7 = $data.data;
        $last = $last + otci_Base46_decodeUnsigned($flow) | 0;
        var$8 = $i * 2 | 0;
        var$7[var$8] = $last;
        var$7[var$8 + 1 | 0] = otci_Base46_decode($flow);
        $i = $i + 1 | 0;
    }
    return $data;
},
otciu_UnicodeHelper_createCharMapping = $data => {
    let $result, $last, $lastValue, $i, var$6, var$7, $key, $value, var$10;
    $result = $rt_createIntArray(65536);
    $last = 0;
    $lastValue = 0;
    $i = 0;
    a: {
        while (true) {
            var$6 = $data.data;
            if ($i >= var$6.length)
                break a;
            var$7 = $result.data;
            $key = var$6[$i];
            $value = var$6[$i + 1 | 0];
            var$10 = var$7.length;
            if ($key < var$10)
                var$10 = $key;
            else if ($key == $last)
                break;
            ju_Arrays_fill1($result, $last, var$10, $lastValue);
            $i = $i + 2 | 0;
            $last = var$10;
            $lastValue = $value;
        }
    }
    return otciu_CharMapping__init_0($data, $result);
},
jus_Collectors = $rt_classWithoutFields(),
jus_Collectors_toCollection = $collectionFactory => {
    return jus_Collector_of($collectionFactory, jus_Collectors$toCollection$lambda$_1_0__init_0(), jus_Collectors$toCollection$lambda$_1_1__init_0(), $rt_createArray(jus_Collector$Characteristics, 0));
},
jus_Collectors_toList = () => {
    return jus_Collectors_toCollection(jus_Collectors$toList$lambda$_2_0__init_0());
};
function jl_Object$monitorEnterWait$lambda$_6_0() {
    let a = this; jl_Object.call(a);
    a.$_013 = null;
    a.$_13 = null;
    a.$_2 = 0;
    a.$_3 = null;
}
let jl_Object$monitorEnterWait$lambda$_6_0__init_ = (var$0, var$1, var$2, var$3, var$4) => {
    jl_Object__init_(var$0);
    var$0.$_013 = var$1;
    var$0.$_13 = var$2;
    var$0.$_2 = var$3;
    var$0.$_3 = var$4;
},
jl_Object$monitorEnterWait$lambda$_6_0__init_0 = (var_0, var_1, var_2, var_3) => {
    let var_4 = new jl_Object$monitorEnterWait$lambda$_6_0();
    jl_Object$monitorEnterWait$lambda$_6_0__init_(var_4, var_0, var_1, var_2, var_3);
    return var_4;
},
jl_Object$monitorEnterWait$lambda$_6_0_run = var$0 => {
    jl_Object_lambda$monitorEnterWait$0(var$0.$_013, var$0.$_13, var$0.$_2, var$0.$_3);
},
juf_BinaryOperator = $rt_classWithoutFields(0),
ju_Objects = $rt_classWithoutFields(),
ju_Objects_equals = ($a, $b) => {
    if ($a === $b)
        return 1;
    return $a !== null ? $a.$equals0($b) : $b !== null ? 0 : 1;
},
ju_Objects_hashCode = $o => {
    return $o !== null ? $o.$hashCode1() : 0;
},
ju_Objects_requireNonNull0 = $obj => {
    return ju_Objects_requireNonNull($obj, $rt_s(125));
},
ju_Objects_requireNonNull = ($obj, $message) => {
    if ($obj !== null)
        return $obj;
    $rt_throw(jl_NullPointerException__init_1($message));
},
ju_Objects_checkFromIndexSize = ($fromIndex, $size, $length) => {
    if ($fromIndex >= 0 && $size >= 0 && $size <= ($length - $fromIndex | 0))
        return $fromIndex;
    $rt_throw(jl_IndexOutOfBoundsException__init_());
};
function jusi_StreamOverSpliterator() {
    jusi_SimpleStreamImpl.call(this);
    this.$spliterator0 = null;
}
let jusi_StreamOverSpliterator__init_ = ($this, $spliterator) => {
    jusi_SimpleStreamImpl__init_($this);
    $this.$spliterator0 = $spliterator;
},
jusi_StreamOverSpliterator__init_0 = var_0 => {
    let var_1 = new jusi_StreamOverSpliterator();
    jusi_StreamOverSpliterator__init_(var_1, var_0);
    return var_1;
},
jusi_StreamOverSpliterator_next = ($this, $consumer) => {
    let $action;
    $action = jusi_StreamOverSpliterator$AdapterAction__init_0($consumer);
    while ($this.$spliterator0.$tryAdvance($action)) {
        if ($action.$wantsMore)
            continue;
        else
            return 1;
    }
    return 0;
},
jusi_StreamOverSpliterator_estimateSize = $this => {
    return Long_lo(($this.$spliterator0.$estimateSize0()));
},
ju_Queue = $rt_classWithoutFields(0),
jl_ArrayStoreException = $rt_classWithoutFields(jl_RuntimeException),
jl_ArrayStoreException__init_0 = $this => {
    jl_RuntimeException__init_($this);
},
jl_ArrayStoreException__init_ = () => {
    let var_0 = new jl_ArrayStoreException();
    jl_ArrayStoreException__init_0(var_0);
    return var_0;
},
ju_Spliterator = $rt_classWithoutFields(0),
ju_SequencedCollection = $rt_classWithoutFields(0);
function jusi_SpliteratorOverCollection() {
    let a = this; jl_Object.call(a);
    a.$collection = null;
    a.$iterator0 = null;
}
let jusi_SpliteratorOverCollection__init_ = ($this, $collection) => {
    jl_Object__init_($this);
    $this.$collection = $collection;
},
jusi_SpliteratorOverCollection__init_0 = var_0 => {
    let var_1 = new jusi_SpliteratorOverCollection();
    jusi_SpliteratorOverCollection__init_(var_1, var_0);
    return var_1;
},
jusi_SpliteratorOverCollection_tryAdvance = ($this, $action) => {
    jusi_SpliteratorOverCollection_ensureIterator($this);
    if (!$this.$iterator0.$hasNext())
        return 0;
    $action.$accept0($this.$iterator0.$next());
    return 1;
},
jusi_SpliteratorOverCollection_ensureIterator = $this => {
    if ($this.$iterator0 === null)
        $this.$iterator0 = $this.$collection.$iterator();
},
jusi_SpliteratorOverCollection_estimateSize = $this => {
    return Long_fromInt($this.$collection.$size());
};
function ju_HashMap$AbstractMapIterator() {
    let a = this; jl_Object.call(a);
    a.$position = 0;
    a.$expectedModCount = 0;
    a.$futureEntry = null;
    a.$currentEntry = null;
    a.$prevEntry = null;
    a.$associatedMap = null;
}
let ju_HashMap$AbstractMapIterator__init_ = ($this, $hm) => {
    jl_Object__init_($this);
    $this.$associatedMap = $hm;
    $this.$expectedModCount = $hm.$modCount;
    $this.$futureEntry = null;
},
ju_HashMap$AbstractMapIterator__init_0 = var_0 => {
    let var_1 = new ju_HashMap$AbstractMapIterator();
    ju_HashMap$AbstractMapIterator__init_(var_1, var_0);
    return var_1;
},
ju_HashMap$AbstractMapIterator_hasNext = $this => {
    if ($this.$futureEntry !== null)
        return 1;
    while ($this.$position < $this.$associatedMap.$elementData.data.length) {
        if ($this.$associatedMap.$elementData.data[$this.$position] !== null)
            return 1;
        $this.$position = $this.$position + 1 | 0;
    }
    return 0;
},
ju_HashMap$AbstractMapIterator_checkConcurrentMod = $this => {
    if ($this.$expectedModCount == $this.$associatedMap.$modCount)
        return;
    $rt_throw(ju_ConcurrentModificationException__init_());
},
ju_HashMap$AbstractMapIterator_makeNext = $this => {
    let var$1, var$2;
    ju_HashMap$AbstractMapIterator_checkConcurrentMod($this);
    if (!$this.$hasNext())
        $rt_throw(ju_NoSuchElementException__init_());
    if ($this.$futureEntry === null) {
        var$1 = $this.$associatedMap.$elementData.data;
        var$2 = $this.$position;
        $this.$position = var$2 + 1 | 0;
        $this.$currentEntry = var$1[var$2];
        $this.$futureEntry = $this.$currentEntry.$next4;
        $this.$prevEntry = null;
    } else {
        if ($this.$currentEntry !== null)
            $this.$prevEntry = $this.$currentEntry;
        $this.$currentEntry = $this.$futureEntry;
        $this.$futureEntry = $this.$futureEntry.$next4;
    }
},
ju_HashMap$KeyIterator = $rt_classWithoutFields(ju_HashMap$AbstractMapIterator),
ju_HashMap$KeyIterator__init_ = ($this, $map) => {
    ju_HashMap$AbstractMapIterator__init_($this, $map);
},
ju_HashMap$KeyIterator__init_0 = var_0 => {
    let var_1 = new ju_HashMap$KeyIterator();
    ju_HashMap$KeyIterator__init_(var_1, var_0);
    return var_1;
},
ju_HashMap$KeyIterator_next = $this => {
    ju_HashMap$AbstractMapIterator_makeNext($this);
    return $this.$currentEntry.$key;
},
juf_DoubleSupplier = $rt_classWithoutFields(0);
function oajqs_SamplingOptions$lambda$new$0$lambda$_12_0() {
    jl_Object.call(this);
    this.$_016 = null;
}
let oajqs_SamplingOptions$lambda$new$0$lambda$_12_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_016 = var$1;
},
oajqs_SamplingOptions$lambda$new$0$lambda$_12_0__init_0 = var_0 => {
    let var_1 = new oajqs_SamplingOptions$lambda$new$0$lambda$_12_0();
    oajqs_SamplingOptions$lambda$new$0$lambda$_12_0__init_(var_1, var_0);
    return var_1;
},
oajqs_SamplingOptions$lambda$new$0$lambda$_12_0_getAsDouble = var$0 => {
    return var$0.$_016.$nextDouble();
},
otji_JSWrapper = $rt_classWithoutFields(),
juf_Function = $rt_classWithoutFields(0);
function ju_HashSet() {
    ju_AbstractSet.call(this);
    this.$backingMap = null;
}
let ju_HashSet__init_0 = $this => {
    ju_HashSet__init_($this, ju_HashMap__init_2());
},
ju_HashSet__init_1 = () => {
    let var_0 = new ju_HashSet();
    ju_HashSet__init_0(var_0);
    return var_0;
},
ju_HashSet__init_ = ($this, $backingMap) => {
    ju_AbstractSet__init_($this);
    $this.$backingMap = $backingMap;
},
ju_HashSet__init_2 = var_0 => {
    let var_1 = new ju_HashSet();
    ju_HashSet__init_(var_1, var_0);
    return var_1;
},
ju_HashSet_add = ($this, $object) => {
    return $this.$backingMap.$put($object, $this) !== null ? 0 : 1;
},
ju_HashSet_contains = ($this, $object) => {
    return $this.$backingMap.$containsKey($object);
},
ju_HashSet_iterator = $this => {
    return ($this.$backingMap.$keySet()).$iterator();
},
ju_HashSet_size = $this => {
    return $this.$backingMap.$size();
},
otp_Platform = $rt_classWithoutFields(),
otp_Platform_clone = var$1 => {
    let copy = new var$1.constructor();
    for (let field in var$1) {
        if (var$1.hasOwnProperty(field)) {
            copy[field] = var$1[field];
        }
    }
    return copy;
},
otp_Platform_launchThread = var$1 => {
    var$1.$run();
},
otp_Platform_postpone = $runnable => {
    otp_Platform_schedule($runnable, 0);
},
otp_Platform_schedule = (var$1, var$2) => {
    setTimeout(() => {
        otp_Platform_launchThread(var$1);
    }, var$2);
};
function jl_Boolean() {
    jl_Object.call(this);
    this.$value3 = 0;
}
let jl_Boolean_TRUE = null,
jl_Boolean_FALSE = null,
jl_Boolean_TYPE = null,
jl_Boolean_$callClinit = () => {
    jl_Boolean_$callClinit = $rt_eraseClinit(jl_Boolean);
    jl_Boolean__clinit_();
},
jl_Boolean__init_0 = ($this, var$1) => {
    jl_Boolean_$callClinit();
    jl_Object__init_($this);
    $this.$value3 = var$1;
},
jl_Boolean__init_ = var_0 => {
    let var_1 = new jl_Boolean();
    jl_Boolean__init_0(var_1, var_0);
    return var_1;
},
jl_Boolean_parseBoolean = $s => {
    jl_Boolean_$callClinit();
    return $s !== null && jl_String_equals(jl_String_toLowerCase($s), $rt_s(126)) ? 1 : 0;
},
jl_Boolean_toString0 = $value => {
    jl_Boolean_$callClinit();
    return !$value ? $rt_s(127) : $rt_s(126);
},
jl_Boolean_toString = $this => {
    return jl_Boolean_toString0($this.$value3);
},
jl_Boolean_hashCode = $this => {
    return jl_Boolean_hashCode0($this.$value3);
},
jl_Boolean_hashCode0 = $value => {
    jl_Boolean_$callClinit();
    return !$value ? 1237 : 1231;
},
jl_Boolean_equals = ($this, $obj) => {
    if ($this === $obj)
        return 1;
    return $obj instanceof jl_Boolean && $obj.$value3 == $this.$value3 ? 1 : 0;
},
jl_Boolean__clinit_ = () => {
    jl_Boolean_TRUE = jl_Boolean__init_(1);
    jl_Boolean_FALSE = jl_Boolean__init_(0);
    jl_Boolean_TYPE = $rt_cls($rt_booleancls);
},
ju_NoSuchElementException = $rt_classWithoutFields(jl_RuntimeException),
ju_NoSuchElementException__init_0 = $this => {
    jl_RuntimeException__init_($this);
},
ju_NoSuchElementException__init_ = () => {
    let var_0 = new ju_NoSuchElementException();
    ju_NoSuchElementException__init_0(var_0);
    return var_0;
};
function oajvs_ComplexCell() {
    let a = this; jl_Record.call(a);
    a.$re0 = 0.0;
    a.$im0 = 0.0;
}
let oajvs_ComplexCell__init_ = ($this, $re, $im) => {
    jl_Record__init_($this);
    $this.$re0 = $re;
    $this.$im0 = $im;
},
oajvs_ComplexCell__init_0 = (var_0, var_1) => {
    let var_2 = new oajvs_ComplexCell();
    oajvs_ComplexCell__init_(var_2, var_0, var_1);
    return var_2;
},
oajvs_ComplexCell_toString = $this => {
    return ((((((jl_StringBuilder__init_0($rt_s(128))).$append1($rt_s(129))).$append10($this.$re0)).$append1($rt_s(130))).$append10($this.$im0)).$append1($rt_s(47))).$toString();
},
oajvs_ComplexCell_hashCode = $this => {
    return ((31 + jl_Double_hashCode($this.$re0) | 0) * 31 | 0) + jl_Double_hashCode($this.$im0) | 0;
},
oajvs_ComplexCell_equals = ($this, $o) => {
    let var$2, var$3;
    if ($this === $o)
        var$2 = 1;
    else if ($o !== null && jl_Object_getClass($o) === $rt_cls(oajvs_ComplexCell)) {
        var$3 = $o;
        var$2 = $this.$re0 !== var$3.$re0 ? 0 : $this.$im0 === var$3.$im0 ? 1 : 0;
    } else
        var$2 = 0;
    return var$2;
},
oajvs_ComplexCell_re = $this => {
    return $this.$re0;
},
oajvs_ComplexCell_im = $this => {
    return $this.$im0;
},
jlr_AnnotatedElement = $rt_classWithoutFields(0),
jlr_GenericDeclaration = $rt_classWithoutFields(0),
oajqg_U3 = $rt_classWithoutFields(oajqg_Gate),
oajqg_U3__init_ = ($this, $theta, $phi, $lambda, $indexes) => {
    oajqg_Gate__init_($this, 1, oaju_Constants_u3Matrix($theta, $phi, $lambda), $rt_s(30), $indexes);
},
oajqg_U3__init_0 = (var_0, var_1, var_2, var_3) => {
    let var_4 = new oajqg_U3();
    oajqg_U3__init_(var_4, var_0, var_1, var_2, var_3);
    return var_4;
},
oti_AsyncCallback = $rt_classWithoutFields(0);
function oajm_Complex() {
    let a = this; jl_Object.call(a);
    a.$real = 0.0;
    a.$imaginary = 0.0;
}
let oajm_Complex_ZERO = null,
oajm_Complex_ONE = null,
oajm_Complex_I = null,
oajm_Complex_$callClinit = () => {
    oajm_Complex_$callClinit = $rt_eraseClinit(oajm_Complex);
    oajm_Complex__clinit_();
},
oajm_Complex__init_0 = ($this, $real, $imaginary) => {
    oajm_Complex_$callClinit();
    jl_Object__init_($this);
    $this.$real = $real;
    $this.$imaginary = $imaginary;
},
oajm_Complex__init_ = (var_0, var_1) => {
    let var_2 = new oajm_Complex();
    oajm_Complex__init_0(var_2, var_0, var_1);
    return var_2;
},
oajm_Complex_getReal = $this => {
    return $this.$real;
},
oajm_Complex_getImaginary = $this => {
    return $this.$imaginary;
},
oajm_Complex_multiply0 = ($this, $factor) => {
    return oajm_Complex__init_($this.$real * $factor.$real - $this.$imaginary * $factor.$imaginary, $this.$real * $factor.$imaginary + $this.$imaginary * $factor.$real);
},
oajm_Complex_multiply = ($this, $factor) => {
    return oajm_Complex__init_($this.$real * $factor, $this.$imaginary * $factor);
},
oajm_Complex_expI = $theta => {
    oajm_Complex_$callClinit();
    return oajm_Complex__init_(jl_Math_cos($theta), jl_Math_sin($theta));
},
oajm_Complex_equals = ($this, $other) => {
    let $c;
    if ($this === $other)
        return 1;
    if (!($other instanceof oajm_Complex))
        return 0;
    $c = $other;
    return $this.$real === $c.$real && $this.$imaginary === $c.$imaginary ? 1 : 0;
},
oajm_Complex_toString = $this => {
    return ((((((jl_StringBuilder__init_()).$append1($rt_s(131))).$append10($this.$real)).$append1($rt_s(57))).$append10($this.$imaginary)).$append1($rt_s(132))).$toString();
},
oajm_Complex__clinit_ = () => {
    oajm_Complex_ZERO = oajm_Complex__init_(0.0, 0.0);
    oajm_Complex_ONE = oajm_Complex__init_(1.0, 0.0);
    oajm_Complex_I = oajm_Complex__init_(0.0, 1.0);
},
oajvs_GateKind = $rt_classWithoutFields(jl_Enum),
oajvs_GateKind_H = null,
oajvs_GateKind_X = null,
oajvs_GateKind_Y = null,
oajvs_GateKind_Z = null,
oajvs_GateKind_S = null,
oajvs_GateKind_T = null,
oajvs_GateKind_CNOT = null,
oajvs_GateKind_CZ = null,
oajvs_GateKind_CY = null,
oajvs_GateKind_SWAP = null,
oajvs_GateKind_CSWAP = null,
oajvs_GateKind_TOFFOLI = null,
oajvs_GateKind_RX = null,
oajvs_GateKind_RY = null,
oajvs_GateKind_RZ = null,
oajvs_GateKind_PHASE = null,
oajvs_GateKind_U3 = null,
oajvs_GateKind_MULTI_CONTROLLED = null,
oajvs_GateKind_ORACLE = null,
oajvs_GateKind_GENERIC = null,
oajvs_GateKind_MEASUREMENT = null,
oajvs_GateKind_RESET = null,
oajvs_GateKind_IDENTITY = null,
oajvs_GateKind_$VALUES = null,
oajvs_GateKind_$callClinit = () => {
    oajvs_GateKind_$callClinit = $rt_eraseClinit(oajvs_GateKind);
    oajvs_GateKind__clinit_();
},
oajvs_GateKind_values = () => {
    oajvs_GateKind_$callClinit();
    return oajvs_GateKind_$VALUES.$clone0();
},
oajvs_GateKind_valueOf = $name => {
    oajvs_GateKind_$callClinit();
    return jl_Enum_valueOf($rt_cls(oajvs_GateKind), $name);
},
oajvs_GateKind__init_0 = ($this, var$1, var$2) => {
    oajvs_GateKind_$callClinit();
    jl_Enum__init_($this, var$1, var$2);
},
oajvs_GateKind__init_ = (var_0, var_1) => {
    let var_2 = new oajvs_GateKind();
    oajvs_GateKind__init_0(var_2, var_0, var_1);
    return var_2;
},
oajvs_GateKind_$values = () => {
    let var$1, var$2;
    oajvs_GateKind_$callClinit();
    var$1 = $rt_createArray(oajvs_GateKind, 23);
    var$2 = var$1.data;
    var$2[0] = oajvs_GateKind_H;
    var$2[1] = oajvs_GateKind_X;
    var$2[2] = oajvs_GateKind_Y;
    var$2[3] = oajvs_GateKind_Z;
    var$2[4] = oajvs_GateKind_S;
    var$2[5] = oajvs_GateKind_T;
    var$2[6] = oajvs_GateKind_CNOT;
    var$2[7] = oajvs_GateKind_CZ;
    var$2[8] = oajvs_GateKind_CY;
    var$2[9] = oajvs_GateKind_SWAP;
    var$2[10] = oajvs_GateKind_CSWAP;
    var$2[11] = oajvs_GateKind_TOFFOLI;
    var$2[12] = oajvs_GateKind_RX;
    var$2[13] = oajvs_GateKind_RY;
    var$2[14] = oajvs_GateKind_RZ;
    var$2[15] = oajvs_GateKind_PHASE;
    var$2[16] = oajvs_GateKind_U3;
    var$2[17] = oajvs_GateKind_MULTI_CONTROLLED;
    var$2[18] = oajvs_GateKind_ORACLE;
    var$2[19] = oajvs_GateKind_GENERIC;
    var$2[20] = oajvs_GateKind_MEASUREMENT;
    var$2[21] = oajvs_GateKind_RESET;
    var$2[22] = oajvs_GateKind_IDENTITY;
    return var$1;
},
oajvs_GateKind__clinit_ = () => {
    oajvs_GateKind_H = oajvs_GateKind__init_($rt_s(11), 0);
    oajvs_GateKind_X = oajvs_GateKind__init_($rt_s(12), 1);
    oajvs_GateKind_Y = oajvs_GateKind__init_($rt_s(13), 2);
    oajvs_GateKind_Z = oajvs_GateKind__init_($rt_s(14), 3);
    oajvs_GateKind_S = oajvs_GateKind__init_($rt_s(15), 4);
    oajvs_GateKind_T = oajvs_GateKind__init_($rt_s(16), 5);
    oajvs_GateKind_CNOT = oajvs_GateKind__init_($rt_s(133), 6);
    oajvs_GateKind_CZ = oajvs_GateKind__init_($rt_s(21), 7);
    oajvs_GateKind_CY = oajvs_GateKind__init_($rt_s(22), 8);
    oajvs_GateKind_SWAP = oajvs_GateKind__init_($rt_s(134), 9);
    oajvs_GateKind_CSWAP = oajvs_GateKind__init_($rt_s(135), 10);
    oajvs_GateKind_TOFFOLI = oajvs_GateKind__init_($rt_s(136), 11);
    oajvs_GateKind_RX = oajvs_GateKind__init_($rt_s(137), 12);
    oajvs_GateKind_RY = oajvs_GateKind__init_($rt_s(138), 13);
    oajvs_GateKind_RZ = oajvs_GateKind__init_($rt_s(139), 14);
    oajvs_GateKind_PHASE = oajvs_GateKind__init_($rt_s(140), 15);
    oajvs_GateKind_U3 = oajvs_GateKind__init_($rt_s(30), 16);
    oajvs_GateKind_MULTI_CONTROLLED = oajvs_GateKind__init_($rt_s(141), 17);
    oajvs_GateKind_ORACLE = oajvs_GateKind__init_($rt_s(142), 18);
    oajvs_GateKind_GENERIC = oajvs_GateKind__init_($rt_s(143), 19);
    oajvs_GateKind_MEASUREMENT = oajvs_GateKind__init_($rt_s(144), 20);
    oajvs_GateKind_RESET = oajvs_GateKind__init_($rt_s(145), 21);
    oajvs_GateKind_IDENTITY = oajvs_GateKind__init_($rt_s(146), 22);
    oajvs_GateKind_$VALUES = oajvs_GateKind_$values();
},
jlr_Type = $rt_classWithoutFields(0);
function jl_Class() {
    let a = this; jl_Object.call(a);
    a.$flags = 0;
    a.$classInfo = null;
    a.$name1 = null;
}
let jl_Class__init_0 = ($this, $classInfo) => {
    jl_Object__init_($this);
    $this.$classInfo = $classInfo;
},
jl_Class__init_ = var_0 => {
    let var_1 = new jl_Class();
    jl_Class__init_0(var_1, var_0);
    return var_1;
},
jl_Class_createClass = $classInfo => {
    return jl_Class__init_($classInfo);
},
jl_Class_toString = $this => {
    let var$1, var$2, var$3;
    var$1 = jl_Class_isInterface($this) ? $rt_s(147) : !jl_Class_isPrimitive($this) ? $rt_s(148) : $rt_s(125);
    var$2 = jl_Class_getName($this);
    var$3 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append(var$3, var$1), var$2);
    return jl_StringBuilder_toString(var$3);
},
jl_Class_getClassInfo = $this => {
    return $this.$classInfo;
},
jl_Class_isInstance = ($this, $obj) => {
    return $obj !== null && jl_Class_isAssignableFrom($this, jl_Object_getClass($obj)) ? 1 : 0;
},
jl_Class_isAssignableFrom = ($this, $obj) => {
    return $rt_isAssignable($obj.$classInfo, $this.$classInfo);
},
jl_Class_getName = $this => {
    let $metadataName, $result, $itemType, $itemName, var$5;
    if (!($this.$flags & 1)) {
        $this.$flags = $this.$flags | 1;
        $metadataName = $this.$classInfo[$rt_meta].name;
        $result = $metadataName === null ? null : $rt_str($metadataName);
        if ($result === null) {
            $itemType = $this.$classInfo[$rt_meta].itemType;
            if ($itemType !== null) {
                $itemName = jl_Class_getName($rt_cls($itemType));
                if ($itemName !== null) {
                    if ($itemType[$rt_meta].itemType !== null) {
                        var$5 = jl_StringBuilder__init_();
                        jl_StringBuilder_append(jl_StringBuilder_append0(var$5, 91), $itemName);
                        $result = jl_StringBuilder_toString(var$5);
                    } else {
                        var$5 = jl_StringBuilder__init_();
                        jl_StringBuilder_append0(jl_StringBuilder_append(jl_StringBuilder_append(var$5, $rt_s(149)), $itemName), 59);
                        $result = jl_StringBuilder_toString(var$5);
                    }
                }
            }
        }
        $this.$name1 = $result;
    }
    return $this.$name1;
},
jl_Class_isPrimitive = $this => {
    return !$this.$classInfo[$rt_meta].primitiveKind ? 0 : 1;
},
jl_Class_isEnum = $this => {
    return !($this.$classInfo[$rt_meta].modifiers & 65536) ? 0 : 1;
},
jl_Class_isInterface = $this => {
    return !($this.$classInfo[$rt_meta].modifiers & 512) ? 0 : 1;
},
jl_Class_getComponentType = $this => {
    let $itemTypeInfo;
    $itemTypeInfo = $this.$classInfo[$rt_meta].itemType;
    return $itemTypeInfo === null ? null : $rt_cls($itemTypeInfo);
},
jl_Class_getSuperclass = $this => {
    return $this.$classInfo[$rt_meta].parent === null ? null : $rt_cls($this.$classInfo[$rt_meta].parent);
},
jl_Class_getEnumConstants = $this => {
    let $count, $data, $i;
    if (!jl_Class_isEnum($this))
        return null;
    jl_Class_initialize($this);
    $count = $rt_enumConstants($this.$classInfo).length;
    $data = otrr_ClassInfo_newArrayInstance($this.$classInfo, $count);
    $i = 0;
    while ($i < $count) {
        $data.data[$i] = $rt_enumConstants($this.$classInfo)[$i];
        $i = $i + 1 | 0;
    }
    return $data;
},
jl_Class_initialize = $this => {
    $this.$classInfo[$rt_meta].clinit();
},
ju_Arrays = $rt_classWithoutFields(),
ju_Arrays_copyOf0 = ($array, $length) => {
    let var$3, $result, $sz, $i;
    var$3 = $array.data;
    $result = $rt_createCharArray($length);
    $sz = jl_Math_min($length, var$3.length);
    $i = 0;
    while ($i < $sz) {
        $result.data[$i] = var$3[$i];
        $i = $i + 1 | 0;
    }
    return $result;
},
ju_Arrays_copyOf = ($original, $newLength) => {
    let var$3, $result, $sz, $i;
    var$3 = $original.data;
    $result = jlr_Array_newInstance(jl_Class_getComponentType(jl_Object_getClass($original)), $newLength);
    $sz = jl_Math_min($newLength, var$3.length);
    $i = 0;
    while ($i < $sz) {
        $result.data[$i] = var$3[$i];
        $i = $i + 1 | 0;
    }
    return $result;
},
ju_Arrays_fill1 = ($a, $fromIndex, $toIndex, $val) => {
    let var$5, var$6;
    if ($fromIndex > $toIndex)
        $rt_throw(jl_IllegalArgumentException__init_0());
    while ($fromIndex < $toIndex) {
        var$5 = $a.data;
        var$6 = $fromIndex + 1 | 0;
        var$5[$fromIndex] = $val;
        $fromIndex = var$6;
    }
},
ju_Arrays_fill0 = ($a, $fromIndex, $toIndex, $val) => {
    let var$5, var$6;
    if ($fromIndex > $toIndex)
        $rt_throw(jl_IllegalArgumentException__init_0());
    while ($fromIndex < $toIndex) {
        var$5 = $a.data;
        var$6 = $fromIndex + 1 | 0;
        var$5[$fromIndex] = $val;
        $fromIndex = var$6;
    }
},
ju_Arrays_fill2 = ($a, $val) => {
    ju_Arrays_fill0($a, 0, $a.data.length, $val);
},
ju_Arrays_fill = ($a, $fromIndex, $toIndex, $val) => {
    let var$5, var$6;
    if ($fromIndex > $toIndex)
        $rt_throw(jl_IllegalArgumentException__init_0());
    while ($fromIndex < $toIndex) {
        var$5 = $a.data;
        var$6 = $fromIndex + 1 | 0;
        var$5[$fromIndex] = $val;
        $fromIndex = var$6;
    }
},
ju_Arrays_fill3 = ($a, $val) => {
    ju_Arrays_fill($a, 0, $a.data.length, $val);
},
ju_Arrays_binarySearch = ($a, $key) => {
    return ju_Arrays_binarySearch0($a, 0, $a.data.length, $key);
},
ju_Arrays_binarySearch0 = ($a, $fromIndex, $toIndex, $key) => {
    let $u, var$6, $i, $e, var$9;
    if ($fromIndex > $toIndex)
        $rt_throw(jl_IllegalArgumentException__init_0());
    $u = $toIndex - 1 | 0;
    while (true) {
        if ($fromIndex > $u)
            return ( -$fromIndex | 0) - 1 | 0;
        var$6 = $a.data;
        $i = ($fromIndex + $u | 0) / 2 | 0;
        $e = var$6[$i];
        var$9 = $rt_compare($e, $key);
        if (!var$9)
            break;
        if (var$9 <= 0)
            $fromIndex = $i + 1 | 0;
        else
            $u = $i - 1 | 0;
    }
    return $i;
},
ju_Arrays_asList = $a => {
    ju_Objects_requireNonNull0($a);
    return ju_Arrays$ArrayAsList__init_0($a);
},
jl_System = $rt_classWithoutFields(),
jl_System_properties = null,
jl_System_arraycopy = ($src, $srcPos, $dest, $destPos, $length) => {
    let var$6, $srcType, $targetType, $srcArray, $i, var$11, var$12, $elem;
    if ($src !== null && $dest !== null) {
        if ($srcPos >= 0 && $destPos >= 0 && $length >= 0 && ($srcPos + $length | 0) <= jlr_Array_getLength($src)) {
            var$6 = $destPos + $length | 0;
            if (var$6 <= jlr_Array_getLength($dest)) {
                a: {
                    b: {
                        if ($src !== $dest) {
                            $srcType = jl_Class_getComponentType(jl_Object_getClass($src));
                            $targetType = jl_Class_getComponentType(jl_Object_getClass($dest));
                            if ($srcType !== null && $targetType !== null) {
                                if ($srcType === $targetType)
                                    break b;
                                if (!jl_Class_isPrimitive($srcType) && !jl_Class_isPrimitive($targetType)) {
                                    $srcArray = $src;
                                    $i = 0;
                                    var$6 = $srcPos;
                                    while ($i < $length) {
                                        var$11 = $srcArray.data;
                                        var$12 = var$6 + 1 | 0;
                                        $elem = var$11[var$6];
                                        if (!jl_Class_isInstance($targetType, $elem)) {
                                            jl_System_doArrayCopy($src, $srcPos, $dest, $destPos, $i);
                                            $rt_throw(jl_ArrayStoreException__init_());
                                        }
                                        $i = $i + 1 | 0;
                                        var$6 = var$12;
                                    }
                                    jl_System_doArrayCopy($src, $srcPos, $dest, $destPos, $length);
                                    return;
                                }
                                if (!jl_Class_isPrimitive($srcType))
                                    break a;
                                if (jl_Class_isPrimitive($targetType))
                                    break b;
                                else
                                    break a;
                            }
                            $rt_throw(jl_ArrayStoreException__init_());
                        }
                    }
                    jl_System_doArrayCopy($src, $srcPos, $dest, $destPos, $length);
                    return;
                }
                $rt_throw(jl_ArrayStoreException__init_());
            }
        }
        $rt_throw(jl_IndexOutOfBoundsException__init_());
    }
    $rt_throw(jl_NullPointerException__init_1($rt_s(150)));
},
jl_System_fastArraycopy = ($src, $srcPos, $dest, $destPos, $length) => {
    let var$6;
    if ($srcPos >= 0 && $destPos >= 0 && $length >= 0 && ($srcPos + $length | 0) <= jlr_Array_getLength($src)) {
        var$6 = $destPos + $length | 0;
        if (var$6 <= jlr_Array_getLength($dest)) {
            jl_System_doArrayCopy($src, $srcPos, $dest, $destPos, $length);
            return;
        }
    }
    $rt_throw(jl_IndexOutOfBoundsException__init_());
},
jl_System_doArrayCopy = (var$1, var$2, var$3, var$4, var$5) => {
    if (var$5 !== 0) {
        if (typeof var$1.data.buffer !== 'undefined') {
            var$3.data.set(var$1.data.subarray(var$2, var$2 + var$5), var$4);
        } else if (var$1 !== var$3 || var$4 < var$2) {
            for (let i = 0;i < var$5;i = i + 1 | 0) {
                var$3.data[var$4++] = var$1.data[var$2++];
            }
        } else {
            var$2 = var$2 + var$5 | 0;
            var$4 = var$4 + var$5 | 0;
            for (let i = 0;i < var$5;i = i + 1 | 0) {
                var$3.data[ --var$4] = var$1.data[ --var$2];
            }
        }
    }
},
jl_System_currentTimeMillis = () => {
    return Long_fromNumber((new Date()).getTime());
},
jl_System_initPropertiesIfNeeded = () => {
    let var$1;
    if (jl_System_properties === null) {
        var$1 = ju_Properties__init_1();
        var$1.$put($rt_s(151), $rt_s(152));
        var$1.$put($rt_s(153), $rt_s(154));
        var$1.$put($rt_s(155), !(otrf_VirtualFileSystemProvider_getInstance()).$isWindows() ? $rt_s(156) : $rt_s(157));
        var$1.$put($rt_s(158), !(otrf_VirtualFileSystemProvider_getInstance()).$isWindows() ? $rt_s(159) : $rt_s(160));
        var$1.$put($rt_s(161), jl_System_lineSeparator());
        var$1.$put($rt_s(162), jl_System_getTempDir());
        var$1.$put($rt_s(163), $rt_s(152));
        var$1.$put($rt_s(164), jl_System_getHomeDir());
        jl_System_properties = ju_Properties__init_2(var$1);
    }
},
jl_System_getTempDir = () => {
    return $rt_s(165);
},
jl_System_getHomeDir = () => {
    return $rt_s(156);
},
jl_System_getProperty = $key => {
    jl_System_initPropertiesIfNeeded();
    return jl_System_properties.$getProperty($key);
},
jl_System_lineSeparator = () => {
    return $rt_s(166);
},
jm_Conversion = $rt_classWithoutFields(),
jm_Conversion_digitFitInInt = null,
jm_Conversion_bigRadices = null,
jm_Conversion_$callClinit = () => {
    jm_Conversion_$callClinit = $rt_eraseClinit(jm_Conversion);
    jm_Conversion__clinit_();
},
jm_Conversion__clinit_ = () => {
    jm_Conversion_digitFitInInt = $rt_createIntArrayFromData([(-1), (-1), 31, 19, 15, 13, 11, 11, 10, 9, 9, 8, 8, 8, 8, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5]);
    jm_Conversion_bigRadices = $rt_createIntArrayFromData([(-2147483648), 1162261467, 1073741824, 1220703125, 362797056, 1977326743, 1073741824, 387420489, 1000000000, 214358881, 429981696, 815730721, 1475789056, 170859375, 268435456, 410338673, 612220032, 893871739, 1280000000, 1801088541, 113379904, 148035889, 191102976, 244140625, 308915776, 387420489, 481890304, 594823321, 729000000, 887503681, 1073741824, 1291467969, 1544804416, 1838265625, 60466176]);
},
oajqg_ControlledSwap = $rt_classWithoutFields(oajqg_Gate),
oajqg_ControlledSwap__init_ = ($this, $firstQubit, $secondQubit, $thirdQubit) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 3, oaju_Constants_CONTROLLED_SWAP_MATRIX, $rt_s(24), $rt_wrapArray(jl_Integer, [$firstQubit, $secondQubit, $thirdQubit]));
},
oajqg_ControlledSwap__init_0 = (var_0, var_1, var_2) => {
    let var_3 = new oajqg_ControlledSwap();
    oajqg_ControlledSwap__init_(var_3, var_0, var_1, var_2);
    return var_3;
},
js_SecureRandom = $rt_classWithoutFields(ju_Random),
js_SecureRandom__init_0 = $this => {
    ju_Random__init_($this);
},
js_SecureRandom__init_ = () => {
    let var_0 = new js_SecureRandom();
    js_SecureRandom__init_0(var_0);
    return var_0;
},
js_SecureRandom_next = ($this, $bits) => {
    let $numBytes, $bytes, $val, $i, var$6;
    $numBytes = ($bits + 7 | 0) / 8 | 0;
    $bytes = $rt_createByteArray($numBytes);
    $this.$nextBytes($bytes);
    $val = 0;
    $i = 0;
    while ($i < $numBytes) {
        var$6 = $bytes.data;
        $val = $val << 8 | var$6[$i] & 255;
        $i = $i + 1 | 0;
    }
    return $val >>> (($numBytes * 8 | 0) - $bits | 0) | 0;
},
js_SecureRandom_nextBytes = ($this, $bytes) => {
    let var$2, var$3, $buffer, $i;
    if (!(crypto != null ? 1 : 0))
        jur_RandomGenerator_nextBytes($this, $bytes);
    else {
        var$2 = $bytes.data;
        var$3 = var$2.length;
        $buffer = new Uint8Array(var$3);
        crypto.getRandomValues($buffer);
        $i = 0;
        while ($i < var$3) {
            var$2[$i] = $buffer[$i] << 24 >> 24;
            $i = $i + 1 | 0;
        }
    }
};
let js_SecureRandom_nextInt = $this => {
    return $this.$next2(32);
},
js_SecureRandom_nextDouble = $this => {
    return Long_toNumber(Long_add(Long_shl(Long_fromInt($this.$next2(26)), 27), Long_fromInt($this.$next2(27)))) / 9.007199254740992E15;
},
ju_Collections$5 = $rt_classWithoutFields(),
ju_Collections$5__init_ = $this => {
    jl_Object__init_($this);
},
ju_Collections$5__init_0 = () => {
    let var_0 = new ju_Collections$5();
    ju_Collections$5__init_(var_0);
    return var_0;
};
function jusi_DistinctStreamImpl$wrap$lambda$_1_0() {
    let a = this; jl_Object.call(a);
    a.$_03 = null;
    a.$_1 = null;
}
let jusi_DistinctStreamImpl$wrap$lambda$_1_0__init_ = (var$0, var$1, var$2) => {
    jl_Object__init_(var$0);
    var$0.$_03 = var$1;
    var$0.$_1 = var$2;
},
jusi_DistinctStreamImpl$wrap$lambda$_1_0__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_DistinctStreamImpl$wrap$lambda$_1_0();
    jusi_DistinctStreamImpl$wrap$lambda$_1_0__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_DistinctStreamImpl$wrap$lambda$_1_0_test = (var$0, var$1) => {
    return jusi_DistinctStreamImpl_lambda$wrap$0(var$0.$_03, var$0.$_1, var$1);
};
function jm_BigDecimal() {
    let a = this; jl_Number.call(a);
    a.$intVal = null;
    a.$bitLength3 = 0;
    a.$smallValue = Long_ZERO;
    a.$scale = 0;
    a.$precision = 0;
}
let jm_BigDecimal_ZERO = null,
jm_BigDecimal_ONE = null,
jm_BigDecimal_TEN = null,
jm_BigDecimal_FIVE_POW = null,
jm_BigDecimal_TEN_POW = null,
jm_BigDecimal_LONG_TEN_POW = null,
jm_BigDecimal_LONG_FIVE_POW = null,
jm_BigDecimal_LONG_FIVE_POW_BIT_LENGTH = null,
jm_BigDecimal_LONG_TEN_POW_BIT_LENGTH = null,
jm_BigDecimal_BI_SCALED_BY_ZERO = null,
jm_BigDecimal_ZERO_SCALED_BY = null,
jm_BigDecimal_CH_ZEROS = null,
jm_BigDecimal_$callClinit = () => {
    jm_BigDecimal_$callClinit = $rt_eraseClinit(jm_BigDecimal);
    jm_BigDecimal__clinit_();
},
jm_BigDecimal__init_6 = ($this, $smallValue, $scale) => {
    jm_BigDecimal_$callClinit();
    jl_Number__init_($this);
    $this.$smallValue = $smallValue;
    $this.$scale = $scale;
    $this.$bitLength3 = jm_BigDecimal_bitLength($smallValue);
},
jm_BigDecimal__init_3 = (var_0, var_1) => {
    let var_2 = new jm_BigDecimal();
    jm_BigDecimal__init_6(var_2, var_0, var_1);
    return var_2;
},
jm_BigDecimal__init_5 = ($this, $smallValue, $scale) => {
    jm_BigDecimal_$callClinit();
    jl_Number__init_($this);
    $this.$smallValue = Long_fromInt($smallValue);
    $this.$scale = $scale;
    $this.$bitLength3 = jm_BigDecimal_bitLength0($smallValue);
},
jm_BigDecimal__init_ = (var_0, var_1) => {
    let var_2 = new jm_BigDecimal();
    jm_BigDecimal__init_5(var_2, var_0, var_1);
    return var_2;
},
jm_BigDecimal__init_1 = ($this, $in, $offset, $len) => {
    let $last, var$5, $unscaledBuffer, $bufLength, var$8, $counter, $wasNonZero, var$11, var$12, var$13, var$14, $newScale;
    jm_BigDecimal_$callClinit();
    jl_Number__init_($this);
    $last = $offset + ($len - 1 | 0) | 0;
    if ($in === null)
        $rt_throw(jl_NullPointerException__init_());
    var$5 = $in.data;
    if ($last < var$5.length && $offset >= 0 && $len > 0 && $last >= 0) {
        $unscaledBuffer = jl_StringBuilder__init_1($len);
        $bufLength = 0;
        if ($offset > $last)
            var$8 = $offset;
        else if (var$5[$offset] != 43)
            var$8 = $offset;
        else {
            $offset = $offset + 1 | 0;
            var$8 = $offset;
        }
        $counter = 0;
        $wasNonZero = 0;
        while (true) {
            var$11 = $rt_compare(var$8, $last);
            if (var$11 > 0)
                break;
            if (var$5[var$8] == 46)
                break;
            if (var$5[var$8] == 101)
                break;
            if (var$5[var$8] == 69)
                break;
            if (!$wasNonZero) {
                if (var$5[var$8] != 48)
                    $wasNonZero = 1;
                else
                    $counter = $counter + 1 | 0;
            }
            var$8 = var$8 + 1 | 0;
        }
        var$12 = var$8 - $offset | 0;
        $unscaledBuffer.$append11($in, $offset, var$12);
        var$12 = $bufLength + var$12 | 0;
        if (var$11 <= 0 && var$5[var$8] == 46) {
            var$13 = var$8 + 1 | 0;
            var$8 = var$13;
            while (var$8 <= $last && var$5[var$8] != 101 && var$5[var$8] != 69) {
                if (!$wasNonZero) {
                    if (var$5[var$8] != 48)
                        $wasNonZero = 1;
                    else
                        $counter = $counter + 1 | 0;
                }
                var$8 = var$8 + 1 | 0;
            }
            $this.$scale = var$8 - var$13 | 0;
            var$12 = var$12 + $this.$scale | 0;
            $unscaledBuffer.$append11($in, var$13, $this.$scale);
        } else
            $this.$scale = 0;
        if (var$8 <= $last && !(var$5[var$8] != 101 && var$5[var$8] != 69)) {
            var$13 = var$8 + 1 | 0;
            if (var$13 > $last)
                var$8 = var$13;
            else if (var$5[var$13] != 43)
                var$8 = var$13;
            else {
                var$8 = var$13 + 1 | 0;
                if (var$8 > $last)
                    var$8 = var$13;
                else if (var$5[var$8] == 45)
                    var$8 = var$13;
            }
            var$14 = jl_String_valueOf0($in, var$8, ($last + 1 | 0) - var$8 | 0);
            $newScale = Long_sub(Long_fromInt($this.$scale), Long_fromInt(jl_Integer_parseInt0(var$14)));
            $this.$scale = Long_lo($newScale);
            if (Long_ne($newScale, Long_fromInt($this.$scale)))
                $rt_throw(jl_NumberFormatException__init_1($rt_s(167)));
        }
        if (var$12 >= 19)
            jm_BigDecimal_setUnscaledValue($this, jm_BigInteger__init_9($unscaledBuffer.$toString()));
        else {
            $this.$smallValue = jl_Long_parseLong($unscaledBuffer.$toString());
            $this.$bitLength3 = jm_BigDecimal_bitLength($this.$smallValue);
        }
        $this.$precision = $unscaledBuffer.$length() - $counter | 0;
        if ($unscaledBuffer.$charAt(0) == 45)
            $this.$precision = $this.$precision - 1 | 0;
        return;
    }
    $rt_throw(jl_NumberFormatException__init_());
},
jm_BigDecimal__init_8 = (var_0, var_1, var_2) => {
    let var_3 = new jm_BigDecimal();
    jm_BigDecimal__init_1(var_3, var_0, var_1, var_2);
    return var_3;
},
jm_BigDecimal__init_4 = ($this, $val) => {
    jm_BigDecimal_$callClinit();
    jm_BigDecimal__init_1($this, jl_String_toCharArray($val), 0, jl_String_length($val));
},
jm_BigDecimal__init_7 = var_0 => {
    let var_1 = new jm_BigDecimal();
    jm_BigDecimal__init_4(var_1, var_0);
    return var_1;
},
jm_BigDecimal__init_2 = ($this, $unscaledVal, $scale) => {
    jm_BigDecimal_$callClinit();
    jl_Number__init_($this);
    if ($unscaledVal !== null) {
        $this.$scale = $scale;
        jm_BigDecimal_setUnscaledValue($this, $unscaledVal);
        return;
    }
    $rt_throw(jl_NullPointerException__init_());
},
jm_BigDecimal__init_0 = (var_0, var_1) => {
    let var_2 = new jm_BigDecimal();
    jm_BigDecimal__init_2(var_2, var_0, var_1);
    return var_2;
},
jm_BigDecimal_valueOf = ($unscaledVal, $scale) => {
    jm_BigDecimal_$callClinit();
    if (!$scale)
        return jm_BigDecimal_valueOf0($unscaledVal);
    if (Long_eq($unscaledVal, Long_ZERO) && $scale >= 0 && $scale < jm_BigDecimal_ZERO_SCALED_BY.data.length)
        return jm_BigDecimal_ZERO_SCALED_BY.data[$scale];
    return jm_BigDecimal__init_3($unscaledVal, $scale);
},
jm_BigDecimal_valueOf0 = $unscaledVal => {
    jm_BigDecimal_$callClinit();
    if (Long_ge($unscaledVal, Long_ZERO) && Long_lt($unscaledVal, Long_fromInt(11)))
        return jm_BigDecimal_BI_SCALED_BY_ZERO.data[Long_lo($unscaledVal)];
    return jm_BigDecimal__init_3($unscaledVal, 0);
},
jm_BigDecimal_divideBigIntegers = ($scaledDividend, $scaledDivisor, $scale, $roundingMode) => {
    let $quotAndRem, var$6, $quotient, $remainder, $sign, $compRem, var$11, $rem, $divisor, var$14;
    jm_BigDecimal_$callClinit();
    $quotAndRem = $scaledDividend.$divideAndRemainder($scaledDivisor);
    var$6 = $quotAndRem.data;
    $quotient = var$6[0];
    $remainder = var$6[1];
    if (!$remainder.$signum())
        return jm_BigDecimal__init_0($quotient, $scale);
    $sign = $rt_imul($scaledDividend.$signum(), $scaledDivisor.$signum());
    if ($scaledDivisor.$bitLength2() >= 63) {
        $compRem = (($remainder.$abs1()).$shiftLeftOneBit0()).$compareTo($scaledDivisor.$abs1());
        var$11 = jm_BigDecimal_roundingBehavior(!$quotient.$testBit(0) ? 0 : 1, $rt_imul($sign, 5 + $compRem | 0), $roundingMode);
    } else {
        $rem = $remainder.$longValue();
        $divisor = $scaledDivisor.$longValue();
        $compRem = jm_BigDecimal_longCompareTo(Long_shl(jl_Math_abs0($rem), 1), jl_Math_abs0($divisor));
        var$11 = jm_BigDecimal_roundingBehavior(!$quotient.$testBit(0) ? 0 : 1, $rt_imul($sign, 5 + $compRem | 0), $roundingMode);
    }
    if (!var$11)
        return jm_BigDecimal__init_0($quotient, $scale);
    if ($quotient.$bitLength2() < 63)
        return jm_BigDecimal_valueOf(Long_add($quotient.$longValue(), Long_fromInt(var$11)), $scale);
    var$14 = $quotient.$add3(jm_BigInteger_valueOf(Long_fromInt(var$11)));
    return jm_BigDecimal__init_0(var$14, $scale);
},
jm_BigDecimal_dividePrimitiveLongs = ($scaledDividend, $scaledDivisor, $scale, $roundingMode) => {
    let $quotient, $remainder, $sign, $compRem;
    jm_BigDecimal_$callClinit();
    $quotient = Long_div($scaledDividend, $scaledDivisor);
    $remainder = Long_rem($scaledDividend, $scaledDivisor);
    $sign = $rt_imul(jl_Long_signum($scaledDividend), jl_Long_signum($scaledDivisor));
    if (Long_ne($remainder, Long_ZERO)) {
        $compRem = jm_BigDecimal_longCompareTo(Long_shl(jl_Math_abs0($remainder), 1), jl_Math_abs0($scaledDivisor));
        $quotient = Long_add($quotient, Long_fromInt(jm_BigDecimal_roundingBehavior(Long_lo($quotient) & 1, $rt_imul($sign, 5 + $compRem | 0), $roundingMode)));
    }
    return jm_BigDecimal_valueOf($quotient, $scale);
},
jm_BigDecimal_signum = $this => {
    if ($this.$bitLength3 >= 64)
        return (jm_BigDecimal_getUnscaledValue($this)).$signum();
    return jl_Long_signum($this.$smallValue);
},
jm_BigDecimal_setScale = ($this, $newScale, $roundingMode) => {
    let $diffScale, var$4, var$5, var$6, var$7;
    if ($roundingMode === null)
        $rt_throw(jl_NullPointerException__init_());
    $diffScale = Long_sub(Long_fromInt($newScale), Long_fromInt($this.$scale));
    var$4 = Long_compare($diffScale, Long_ZERO);
    if (!var$4)
        return $this;
    if (var$4 <= 0) {
        if ($this.$bitLength3 < 64) {
            var$5 = Long_neg($diffScale);
            jm_BigDecimal_$callClinit();
            if (Long_lt(var$5, Long_fromInt(jm_BigDecimal_LONG_TEN_POW.data.length)))
                return jm_BigDecimal_dividePrimitiveLongs($this.$smallValue, jm_BigDecimal_LONG_TEN_POW.data[Long_lo(var$5)], $newScale, $roundingMode);
        }
        return jm_BigDecimal_divideBigIntegers(jm_BigDecimal_getUnscaledValue($this), jm_Multiplication_powerOf10(Long_neg($diffScale)), $newScale, $roundingMode);
    }
    jm_BigDecimal_$callClinit();
    if (Long_lt($diffScale, Long_fromInt(jm_BigDecimal_LONG_TEN_POW.data.length))) {
        var$4 = $this.$bitLength3;
        var$6 = jm_BigDecimal_LONG_TEN_POW_BIT_LENGTH.data;
        var$7 = Long_lo($diffScale);
        if ((var$4 + var$6[var$7] | 0) < 64)
            return jm_BigDecimal_valueOf(Long_mul($this.$smallValue, jm_BigDecimal_LONG_TEN_POW.data[var$7]), $newScale);
    }
    return jm_BigDecimal__init_0(jm_Multiplication_multiplyByTenPow(jm_BigDecimal_getUnscaledValue($this), Long_fromInt(Long_lo($diffScale))), $newScale);
},
jm_BigDecimal_doubleValue = $this => {
    let $sign, $exponent, $powerOfTwo, $mantisa, var$5, $powerOfTen, $k, $quotAndRem, var$9, $compRem, $lowestSetBit, $discardedSize, $bits, var$14, var$15, var$16, var$17;
    $sign = $this.$signum();
    $exponent = 1076;
    $powerOfTwo = Long_sub(Long_fromInt($this.$bitLength3), Long_fromNumber($this.$scale / 0.3010299956639812));
    if (Long_ge($powerOfTwo, Long_fromInt(-1074)) && $sign) {
        if (Long_gt($powerOfTwo, Long_fromInt(1025)))
            return $sign * Infinity;
        $mantisa = (jm_BigDecimal_getUnscaledValue($this)).$abs1();
        if ($this.$scale <= 0)
            var$5 = $mantisa.$multiply1(jm_Multiplication_powerOf10(Long_fromInt( -$this.$scale | 0)));
        else {
            $powerOfTen = jm_Multiplication_powerOf10(Long_fromInt($this.$scale));
            $k = 100 - Long_lo($powerOfTwo) | 0;
            if ($k > 0) {
                $mantisa = $mantisa.$shiftLeft0($k);
                $exponent = $exponent - $k | 0;
            }
            $quotAndRem = $mantisa.$divideAndRemainder($powerOfTen);
            var$9 = $quotAndRem.data;
            $compRem = (var$9[1].$shiftLeftOneBit0()).$compareTo($powerOfTen);
            var$5 = (var$9[0].$shiftLeft0(2)).$add3(jm_BigInteger_valueOf(Long_fromInt(($rt_imul($compRem, $compRem + 3 | 0) / 2 | 0) + 1 | 0)));
            $exponent = $exponent + (-2) | 0;
        }
        $lowestSetBit = var$5.$getLowestSetBit();
        $discardedSize = var$5.$bitLength2() - 54 | 0;
        if ($discardedSize <= 0) {
            $bits = Long_shl(var$5.$longValue(),  -$discardedSize | 0);
            var$14 = Long_ne(Long_and($bits, Long_fromInt(3)), Long_fromInt(3)) ? $bits : Long_add($bits, Long_fromInt(2));
        } else {
            $bits = (var$5.$shiftRight0($discardedSize)).$longValue();
            var$14 = !(Long_eq(Long_and($bits, Long_fromInt(1)), Long_fromInt(1)) && $lowestSetBit < $discardedSize) && Long_ne(Long_and($bits, Long_fromInt(3)), Long_fromInt(3)) ? $bits : Long_add($bits, Long_fromInt(2));
        }
        if (Long_eq(Long_and(var$14, Long_create(0, 4194304)), Long_ZERO)) {
            var$15 = Long_shr(var$14, 1);
            var$16 = $exponent + $discardedSize | 0;
        } else {
            var$15 = Long_shr(var$14, 2);
            var$16 = $exponent + ($discardedSize + 1 | 0) | 0;
        }
        if (var$16 > 2046)
            return $sign * Infinity;
        if (var$16 <= 0) {
            if (var$16 < (-53))
                return $sign * 0.0;
            a: {
                var$15 = Long_shr($bits, 1);
                var$17 = Long_and(var$15, Long_shru(Long_fromInt(-1), 63 + var$16 | 0));
                var$15 = Long_shr(var$15,  -var$16 | 0);
                if (Long_ne(Long_and(var$15, Long_fromInt(3)), Long_fromInt(3))) {
                    if (Long_ne(Long_and(var$15, Long_fromInt(1)), Long_fromInt(1)))
                        break a;
                    if (Long_eq(var$17, Long_ZERO))
                        break a;
                    if ($lowestSetBit >= $discardedSize)
                        break a;
                }
                var$15 = Long_add(var$15, Long_fromInt(1));
            }
            var$16 = 0;
            var$15 = Long_shr(var$15, 1);
        }
        var$15 = Long_or(Long_or(Long_and(Long_fromInt($sign), Long_create(0, 2147483648)), Long_shl(Long_fromInt(var$16), 52)), Long_and(var$15, Long_create(4294967295, 1048575)));
        return $rt_longBitsToDouble(var$15);
    }
    return $sign * 0.0;
},
jm_BigDecimal_longCompareTo = ($value1, $value2) => {
    let var$3;
    jm_BigDecimal_$callClinit();
    var$3 = Long_compare($value1, $value2);
    return var$3 > 0 ? 1 : var$3 >= 0 ? 0 : (-1);
},
jm_BigDecimal_roundingBehavior = ($parityBit, $fraction, $roundingMode) => {
    let $increment;
    jm_BigDecimal_$callClinit();
    a: {
        $increment = 0;
        jm_BigDecimal$1_$callClinit();
        switch (jm_BigDecimal$1_$SwitchMap$org$teavm$classlib$java$math$TRoundingMode.data[jl_Enum_ordinal($roundingMode)]) {
            case 1:
                if (!$fraction)
                    break a;
                $rt_throw(jl_ArithmeticException__init_($rt_s(168)));
            case 2:
                $increment = jl_Integer_signum($fraction);
                break a;
            case 3:
                break;
            case 4:
                $increment = jl_Math_max(jl_Integer_signum($fraction), 0);
                break a;
            case 5:
                $increment = jl_Math_min(jl_Integer_signum($fraction), 0);
                break a;
            case 6:
                if (jl_Math_abs($fraction) < 5)
                    break a;
                $increment = jl_Integer_signum($fraction);
                break a;
            case 7:
                if (jl_Math_abs($fraction) <= 5)
                    break a;
                $increment = jl_Integer_signum($fraction);
                break a;
            case 8:
                if ((jl_Math_abs($fraction) + $parityBit | 0) <= 5)
                    break a;
                $increment = jl_Integer_signum($fraction);
                break a;
            default:
                break a;
        }
    }
    return $increment;
},
jm_BigDecimal_getUnscaledValue = $this => {
    if ($this.$intVal === null)
        $this.$intVal = jm_BigInteger_valueOf($this.$smallValue);
    return $this.$intVal;
},
jm_BigDecimal_setUnscaledValue = ($this, $unscaledValue) => {
    $this.$intVal = $unscaledValue;
    $this.$bitLength3 = $unscaledValue.$bitLength2();
    if ($this.$bitLength3 < 64)
        $this.$smallValue = $unscaledValue.$longValue();
},
jm_BigDecimal_bitLength = $smallValue => {
    jm_BigDecimal_$callClinit();
    if (Long_lt($smallValue, Long_ZERO))
        $smallValue = Long_xor($smallValue, Long_fromInt(-1));
    return 64 - jl_Long_numberOfLeadingZeros($smallValue) | 0;
},
jm_BigDecimal_bitLength0 = $smallValue => {
    jm_BigDecimal_$callClinit();
    if ($smallValue < 0)
        $smallValue = $smallValue ^ (-1);
    return 32 - jl_Integer_numberOfLeadingZeros($smallValue) | 0;
},
jm_BigDecimal__clinit_ = () => {
    let $i, $j;
    jm_BigDecimal_ZERO = jm_BigDecimal__init_(0, 0);
    jm_BigDecimal_ONE = jm_BigDecimal__init_(1, 0);
    jm_BigDecimal_TEN = jm_BigDecimal__init_(10, 0);
    jm_BigDecimal_LONG_TEN_POW = $rt_createLongArrayFromData([Long_fromInt(1), Long_fromInt(10), Long_fromInt(100), Long_fromInt(1000), Long_fromInt(10000), Long_fromInt(100000), Long_fromInt(1000000), Long_fromInt(10000000), Long_fromInt(100000000), Long_fromInt(1000000000), Long_create(1410065408, 2), Long_create(1215752192, 23), Long_create(3567587328, 232), Long_create(1316134912, 2328), Long_create(276447232, 23283), Long_create(2764472320, 232830), Long_create(1874919424, 2328306), Long_create(1569325056, 23283064),
    Long_create(2808348672, 232830643)]);
    jm_BigDecimal_LONG_FIVE_POW = $rt_createLongArrayFromData([Long_fromInt(1), Long_fromInt(5), Long_fromInt(25), Long_fromInt(125), Long_fromInt(625), Long_fromInt(3125), Long_fromInt(15625), Long_fromInt(78125), Long_fromInt(390625), Long_fromInt(1953125), Long_fromInt(9765625), Long_fromInt(48828125), Long_fromInt(244140625), Long_fromInt(1220703125), Long_create(1808548329, 1), Long_create(452807053, 7), Long_create(2264035265, 35), Long_create(2730241733, 177), Long_create(766306777, 888), Long_create(3831533885, 4440),
    Long_create(1977800241, 22204), Long_create(1299066613, 111022), Long_create(2200365769, 555111), Long_create(2411894253, 2775557), Long_create(3469536673, 13877787), Long_create(167814181, 69388939), Long_create(839070905, 346944695), Long_create(4195354525, 1734723475)]);
    jm_BigDecimal_LONG_FIVE_POW_BIT_LENGTH = $rt_createIntArray(jm_BigDecimal_LONG_FIVE_POW.data.length);
    jm_BigDecimal_LONG_TEN_POW_BIT_LENGTH = $rt_createIntArray(jm_BigDecimal_LONG_TEN_POW.data.length);
    jm_BigDecimal_BI_SCALED_BY_ZERO = $rt_createArray(jm_BigDecimal, 11);
    jm_BigDecimal_ZERO_SCALED_BY = $rt_createArray(jm_BigDecimal, 11);
    jm_BigDecimal_CH_ZEROS = $rt_createCharArray(100);
    $i = 0;
    while ($i < jm_BigDecimal_ZERO_SCALED_BY.data.length) {
        jm_BigDecimal_BI_SCALED_BY_ZERO.data[$i] = jm_BigDecimal__init_($i, 0);
        jm_BigDecimal_ZERO_SCALED_BY.data[$i] = jm_BigDecimal__init_(0, $i);
        jm_BigDecimal_CH_ZEROS.data[$i] = 48;
        $i = $i + 1 | 0;
    }
    while ($i < jm_BigDecimal_CH_ZEROS.data.length) {
        jm_BigDecimal_CH_ZEROS.data[$i] = 48;
        $i = $i + 1 | 0;
    }
    $j = 0;
    while ($j < jm_BigDecimal_LONG_FIVE_POW_BIT_LENGTH.data.length) {
        jm_BigDecimal_LONG_FIVE_POW_BIT_LENGTH.data[$j] = jm_BigDecimal_bitLength(jm_BigDecimal_LONG_FIVE_POW.data[$j]);
        $j = $j + 1 | 0;
    }
    $j = 0;
    while ($j < jm_BigDecimal_LONG_TEN_POW_BIT_LENGTH.data.length) {
        jm_BigDecimal_LONG_TEN_POW_BIT_LENGTH.data[$j] = jm_BigDecimal_bitLength(jm_BigDecimal_LONG_TEN_POW.data[$j]);
        $j = $j + 1 | 0;
    }
    jm_Multiplication_$callClinit();
    jm_BigDecimal_TEN_POW = jm_Multiplication_bigTenPows;
    jm_BigDecimal_FIVE_POW = jm_Multiplication_bigFivePows;
},
ju_List = $rt_classWithoutFields(0),
ju_List_of = $e => {
    return ju_Collections_singletonList($e);
},
ju_List_copyOf = $collection => {
    return ju_TemplateCollections$ImmutableArrayList__init_2($collection);
};
function ju_AbstractList() {
    ju_AbstractCollection.call(this);
    this.$modCount0 = 0;
}
let ju_AbstractList__init_ = $this => {
    ju_AbstractCollection__init_($this);
},
ju_AbstractList_iterator = $this => {
    return ju_AbstractList$1__init_0($this);
},
ju_AbstractList_hashCode = $this => {
    let $hashCode, $iter, $elem;
    $hashCode = 1;
    $iter = $this.$iterator();
    while ($iter.$hasNext()) {
        $elem = $iter.$next();
        $hashCode = (31 * $hashCode | 0) + ju_Objects_hashCode($elem) | 0;
    }
    return $hashCode;
},
ju_AbstractList_equals = ($this, $other) => {
    let $list, $i;
    if (!$rt_isInstance($other, ju_List))
        return 0;
    $list = $other;
    if ($this.$size() != $list.$size())
        return 0;
    $i = 0;
    while ($i < $list.$size()) {
        if (!ju_Objects_equals($this.$get($i), $list.$get($i)))
            return 0;
        $i = $i + 1 | 0;
    }
    return 1;
},
ju_RandomAccess = $rt_classWithoutFields(0),
ju_TemplateCollections$AbstractImmutableList = $rt_classWithoutFields(ju_AbstractList),
ju_TemplateCollections$AbstractImmutableList__init_ = $this => {
    ju_AbstractList__init_($this);
},
ju_Collections$3 = $rt_classWithoutFields(ju_TemplateCollections$AbstractImmutableList),
ju_Collections$3__init_ = $this => {
    ju_TemplateCollections$AbstractImmutableList__init_($this);
},
ju_Collections$3__init_0 = () => {
    let var_0 = new ju_Collections$3();
    ju_Collections$3__init_(var_0);
    return var_0;
},
ju_Collections$4 = $rt_classWithoutFields(),
ju_Collections$4__init_ = $this => {
    jl_Object__init_($this);
},
ju_Collections$4__init_0 = () => {
    let var_0 = new ju_Collections$4();
    ju_Collections$4__init_(var_0);
    return var_0;
},
ju_Collections$4_hasNext = $this => {
    return 0;
},
ju_Collections$4_next = $this => {
    $rt_throw(ju_NoSuchElementException__init_());
},
jl_Character = $rt_classWithoutFields(),
jl_Character_TYPE = null,
jl_Character_lowerCaseMapping = null,
jl_Character_characterCache = null,
jl_Character_$$metadata$$0 = null,
jl_Character_$callClinit = () => {
    jl_Character_$callClinit = $rt_eraseClinit(jl_Character);
    jl_Character__clinit_();
},
jl_Character_isHighSurrogate = $ch => {
    jl_Character_$callClinit();
    return ($ch & 64512) != 55296 ? 0 : 1;
},
jl_Character_isLowSurrogate = $ch => {
    jl_Character_$callClinit();
    return ($ch & 64512) != 56320 ? 0 : 1;
},
jl_Character_highSurrogate = $codePoint => {
    let var$2;
    jl_Character_$callClinit();
    var$2 = $codePoint - 65536 | 0;
    return (55296 | var$2 >> 10 & 1023) & 65535;
},
jl_Character_lowSurrogate = $codePoint => {
    jl_Character_$callClinit();
    return (56320 | $codePoint & 1023) & 65535;
},
jl_Character_toLowerCase = $ch => {
    jl_Character_$callClinit();
    return jl_Character_toLowerCase0($ch) & 65535;
},
jl_Character_toLowerCase0 = $ch => {
    jl_Character_$callClinit();
    return jl_Character_mapChar(jl_Character_getLowerCaseMapping(), $ch);
},
jl_Character_getLowerCaseMapping = () => {
    let var$1;
    jl_Character_$callClinit();
    if (jl_Character_lowerCaseMapping === null) {
        var$1 = otciu_UnicodeHelper_decodeCaseMapping(((jl_Character_acquireLowerCaseMapping()).value !== null ? $rt_str((jl_Character_acquireLowerCaseMapping()).value) : null));
        jl_Character_lowerCaseMapping = otciu_UnicodeHelper_createCharMapping(var$1);
    }
    return jl_Character_lowerCaseMapping;
},
jl_Character_acquireLowerCaseMapping = () => {
    jl_Character_$callClinit();
    if (jl_Character_$$metadata$$0 === null)
        jl_Character_$$metadata$$0 = jl_Character_acquireLowerCaseMapping$$create();
    return jl_Character_$$metadata$$0;
},
jl_Character_mapChar = ($table, $codePoint) => {
    let $binSearchTable, $index, var$5, var$6;
    jl_Character_$callClinit();
    if ($codePoint < $table.$fastTable.data.length)
        return $codePoint + $table.$fastTable.data[$codePoint] | 0;
    $binSearchTable = $table.$binarySearchTable0;
    $index = jl_Character_binarySearchTable($binSearchTable, $codePoint);
    if ($index >= 0) {
        var$5 = $binSearchTable.data;
        var$6 = $index * 2 | 0;
        if (var$6 < var$5.length)
            return $codePoint + var$5[var$6 + 1 | 0] | 0;
    }
    return 0;
},
jl_Character_binarySearchTable = ($data, $key) => {
    let var$3, $l, $u, $i, $e, var$8;
    jl_Character_$callClinit();
    var$3 = $data.data;
    $l = 0;
    $u = (var$3.length / 2 | 0) - 1 | 0;
    while (true) {
        $i = ($l + $u | 0) / 2 | 0;
        $e = var$3[$i * 2 | 0];
        var$8 = $rt_compare($e, $key);
        if (!var$8)
            break;
        if (var$8 <= 0) {
            $l = $i + 1 | 0;
            if ($l > $u)
                return $i;
        } else {
            $u = $i - 1 | 0;
            if ($u < $l)
                return $u;
        }
    }
    return $i;
},
jl_Character_forDigit = ($digit, $radix) => {
    jl_Character_$callClinit();
    if ($radix >= 2 && $radix <= 36 && $digit >= 0 && $digit < $radix)
        return $digit < 10 ? (48 + $digit | 0) & 65535 : ((97 + $digit | 0) - 10 | 0) & 65535;
    return 0;
},
jl_Character__clinit_ = () => {
    jl_Character_TYPE = $rt_cls($rt_charcls);
    jl_Character_characterCache = $rt_createArray(jl_Character, 128);
},
jl_Character_acquireLowerCaseMapping$$create = () => {
    return {"value" : "NY  H#F#U 4%F#O #F#/ d%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #a1# #%# #%# #%# %%# #%# #%# #%# #%# #%# #%# #%# %%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #<+#%# #%# #%# \'.3#%# #%# #{1#%# #w1%%# %J\'#k1#o1#%# #w1#!3# #23#*3#%# \'23#:3# #>3#%# #%# #%# #N3#%# #N3# %%# #N3#%# #J3%%# #%# #R3#%# \'%# /)#%# #)#%# #)#%# #%# #%# #%# #%# #%# #%# #%# #%# %%# #%# #%# #%# #%# #%# #%# #%# #%# %)#%# #%# #8)#L%#%# #%# #%# #"
    + "%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #a+# #%# #%# #%# #%# #%# #%# #%# #%# #%# /B45#%# #,/#645# %%# #P1#!\'#*\'#%# #%# #%# #%# #%# <-%# #%# \'%# 1&++ %_## #Z#)k%%g%% #F#W hA# 1%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# +]%# %%# #?#%# %a+\'N\'AF#b &#%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# 3%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #^#%# #%# #%# #%# #%# #%# #%# %%# #%# #%# #%# #%# #%# #%# #%"
    + "# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# %*%p kB#oq-&# _?gejg#A1 a$#%# -mo%&# {-%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# 3,4/# #%# #%"
    + "# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# 3C1 1C1 1C1 1C1 1C1 3C/ 1C1 QC1 1C1 1C1 1C%8\'%G# 7i\')G# 7C%D)\' 7C%u)%?# 7X+%P+%G# L-q*/# \'Pw/#8m/# -6## |bA G%# kC.#U !r*%&# &#%# #,05#qX\'#H.5# %%# #%# #%# #e25#D05#q25#m25# #%# %%# 1865%%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# "
    + "#%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# 1%# #%# )%# (a=%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# G%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# y%%# #%# #%# #%# #%# #%# #%# \'%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #%# 5%# #%# #4Fd#%# #%# #%# #%# #%# )%# #<{p# %%# #%# \'%# #%# #%# #%# #%# #%# #%# #%# #%# #%# #P}p#}}p#m}p#D}p#P}p# #@yp#D{p#Lyp#Br#%# #%# #%"
    + "# #%# #%# #%# #%# #%# #,%#L}p#LJd#%# #%# #$$r#%# #%# #%# #%# #%# #%# #%# #%# #P6r#}!rI )%# :GL#) i,5F#U TUg#r {%g#r >\'c#p Lnk%F# .\'F#S HB#F#b o@5F#b F#2#W 4Z;%# /%# #%# %%# \'%# M%# #%# #%# #%# \'%# #%# #%# #%# #%# #%# #%# u.#N#f "};
},
ju_TemplateCollections$AbstractImmutableSet = $rt_classWithoutFields(ju_AbstractSet),
ju_TemplateCollections$AbstractImmutableSet__init_ = $this => {
    ju_AbstractSet__init_($this);
},
ju_Collections$1 = $rt_classWithoutFields(ju_TemplateCollections$AbstractImmutableSet),
ju_Collections$1__init_ = $this => {
    ju_TemplateCollections$AbstractImmutableSet__init_($this);
},
ju_Collections$1__init_0 = () => {
    let var_0 = new ju_Collections$1();
    ju_Collections$1__init_(var_0);
    return var_0;
},
ju_Collections$1_size = $this => {
    return 0;
},
ju_Collections$1_iterator = $this => {
    return ju_Collections_emptyIterator();
};
function jusi_SimpleStreamImpl$toArray$lambda$_21_0() {
    jl_Object.call(this);
    this.$_022 = null;
}
let jusi_SimpleStreamImpl$toArray$lambda$_21_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_022 = var$1;
},
jusi_SimpleStreamImpl$toArray$lambda$_21_0__init_0 = var_0 => {
    let var_1 = new jusi_SimpleStreamImpl$toArray$lambda$_21_0();
    jusi_SimpleStreamImpl$toArray$lambda$_21_0__init_(var_1, var_0);
    return var_1;
},
jusi_SimpleStreamImpl$toArray$lambda$_21_0_test = (var$0, var$1) => {
    return var$0.$_022.$add(var$1);
},
ju_Collections$2 = $rt_classWithoutFields(ju_TemplateCollections$AbstractImmutableMap),
ju_Collections$2__init_ = $this => {
    ju_TemplateCollections$AbstractImmutableMap__init_($this);
},
ju_Collections$2__init_0 = () => {
    let var_0 = new ju_Collections$2();
    ju_Collections$2__init_(var_0);
    return var_0;
},
ju_Collections$2_entrySet = $this => {
    return ju_Collections_emptySet();
},
otrr_ReflectionInfo = $rt_classWithoutFields();
function oajvs_LevelSpec() {
    jl_Record.call(this);
    this.$gates1 = null;
}
let oajvs_LevelSpec__init_ = ($this, $gates) => {
    let var$2;
    jl_Record__init_($this);
    var$2 = ju_List_copyOf($gates);
    $this.$gates1 = var$2;
},
oajvs_LevelSpec__init_0 = var_0 => {
    let var_1 = new oajvs_LevelSpec();
    oajvs_LevelSpec__init_(var_1, var_0);
    return var_1;
},
oajvs_LevelSpec_toString = $this => {
    return ((((jl_StringBuilder__init_0($rt_s(169))).$append1($rt_s(170))).$append($this.$gates1)).$append1($rt_s(47))).$toString();
},
oajvs_LevelSpec_hashCode = $this => {
    return 31 + ju_Objects_hashCode($this.$gates1) | 0;
},
oajvs_LevelSpec_equals = ($this, $o) => {
    let var$2, var$3;
    if ($this === $o)
        var$2 = 1;
    else if ($o !== null && jl_Object_getClass($o) === $rt_cls(oajvs_LevelSpec)) {
        var$3 = $o;
        var$2 = ju_Objects_equals($this.$gates1, var$3.$gates1) ? 1 : 0;
    } else
        var$2 = 0;
    return var$2;
},
oajvs_LevelSpec_gates = $this => {
    return $this.$gates1;
},
oajqg_ControlledY = $rt_classWithoutFields(oajqg_Gate),
oajqg_ControlledY__init_ = ($this, $controlQubit, $targetQubit) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 2, oaju_Constants_CONTROLLED_Y_MATRIX, $rt_s(22), $rt_wrapArray(jl_Integer, [$controlQubit, $targetQubit]));
},
oajqg_ControlledY__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_ControlledY();
    oajqg_ControlledY__init_(var_2, var_0, var_1);
    return var_2;
},
oajqg_ControlledZ = $rt_classWithoutFields(oajqg_Gate),
oajqg_ControlledZ__init_ = ($this, $controlQubit, $targetQubit) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 2, oaju_Constants_CONTROLLED_Z_MATRIX, $rt_s(21), $rt_wrapArray(jl_Integer, [$controlQubit, $targetQubit]));
},
oajqg_ControlledZ__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_ControlledZ();
    oajqg_ControlledZ__init_(var_2, var_0, var_1);
    return var_2;
};
function jl_Object$monitorExit$lambda$_8_1() {
    jl_Object.call(this);
    this.$_00 = null;
}
let jl_Object$monitorExit$lambda$_8_1__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_00 = var$1;
},
jl_Object$monitorExit$lambda$_8_1__init_0 = var_0 => {
    let var_1 = new jl_Object$monitorExit$lambda$_8_1();
    jl_Object$monitorExit$lambda$_8_1__init_(var_1, var_0);
    return var_1;
},
jl_Object$monitorExit$lambda$_8_1_run = var$0 => {
    jl_Object_lambda$monitorExit$2(var$0.$_00);
},
jl_MatchException = $rt_classWithoutFields(jl_RuntimeException),
jl_MatchException__init_ = ($this, $message, $cause) => {
    jl_RuntimeException__init_1($this, $message, $cause);
},
jl_MatchException__init_0 = (var_0, var_1) => {
    let var_2 = new jl_MatchException();
    jl_MatchException__init_(var_2, var_0, var_1);
    return var_2;
},
oajqg_Oracle = $rt_classWithoutFields(oajqg_Gate),
oajqg_Oracle__init_ = ($this, $matrix, $indexes) => {
    oajqg_Gate__init_($this, jl_Math_log(($matrix.$getData()).data.length) / jl_Math_log(2.0) | 0, $matrix, $rt_s(31), $indexes);
},
oajqg_Oracle__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_Oracle();
    oajqg_Oracle__init_(var_2, var_0, var_1);
    return var_2;
},
ju_SequencedSet = $rt_classWithoutFields(0),
ju_Collections$_clinit_$lambda$_59_0 = $rt_classWithoutFields(),
ju_Collections$_clinit_$lambda$_59_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
ju_Collections$_clinit_$lambda$_59_0__init_0 = () => {
    let var_0 = new ju_Collections$_clinit_$lambda$_59_0();
    ju_Collections$_clinit_$lambda$_59_0__init_(var_0);
    return var_0;
},
oajvs_GateSpec$_init_$lambda$_0_0 = $rt_classWithoutFields(),
oajvs_GateSpec$_init_$lambda$_0_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
oajvs_GateSpec$_init_$lambda$_0_0__init_0 = () => {
    let var_0 = new oajvs_GateSpec$_init_$lambda$_0_0();
    oajvs_GateSpec$_init_$lambda$_0_0__init_(var_0);
    return var_0;
},
oajvs_GateSpec$_init_$lambda$_0_0_apply0 = (var$0, var$1) => {
    return oajvs_GateSpec$_init_$lambda$_0_0_apply(var$0, var$1);
},
oajvs_GateSpec$_init_$lambda$_0_0_apply = (var$0, var$1) => {
    return ju_List_copyOf(var$1);
};
function ju_LinkedHashMapIterator() {
    let a = this; jl_Object.call(a);
    a.$base0 = null;
    a.$reversed0 = 0;
    a.$expectedModCount0 = 0;
    a.$futureEntry0 = null;
    a.$currentEntry0 = null;
}
let ju_LinkedHashMapIterator__init_ = ($this, $base, $reversed) => {
    jl_Object__init_($this);
    $this.$base0 = $base;
    $this.$reversed0 = $reversed;
    $this.$expectedModCount0 = $base.$modCount;
    $this.$futureEntry0 = !$reversed ? $base.$head : $base.$tail;
},
ju_LinkedHashMapIterator__init_0 = (var_0, var_1) => {
    let var_2 = new ju_LinkedHashMapIterator();
    ju_LinkedHashMapIterator__init_(var_2, var_0, var_1);
    return var_2;
},
ju_LinkedHashMapIterator_hasNext = $this => {
    return $this.$futureEntry0 === null ? 0 : 1;
},
ju_LinkedHashMapIterator_checkConcurrentMod = $this => {
    if ($this.$expectedModCount0 == $this.$base0.$modCount)
        return;
    $rt_throw(ju_ConcurrentModificationException__init_());
},
ju_LinkedHashMapIterator_makeNext = $this => {
    ju_LinkedHashMapIterator_checkConcurrentMod($this);
    if (!$this.$hasNext())
        $rt_throw(ju_NoSuchElementException__init_());
    $this.$currentEntry0 = $this.$futureEntry0;
    $this.$futureEntry0 = !$this.$reversed0 ? $this.$futureEntry0.$chainForward : $this.$futureEntry0.$chainBackward;
};
function jusi_AnyMatchConsumer() {
    let a = this; jl_Object.call(a);
    a.$matched0 = 0;
    a.$predicate0 = null;
}
let jusi_AnyMatchConsumer__init_ = ($this, $predicate) => {
    jl_Object__init_($this);
    $this.$predicate0 = $predicate;
},
jusi_AnyMatchConsumer__init_0 = var_0 => {
    let var_1 = new jusi_AnyMatchConsumer();
    jusi_AnyMatchConsumer__init_(var_1, var_0);
    return var_1;
},
jusi_AnyMatchConsumer_test = ($this, $t) => {
    $this.$matched0 = $this.$predicate0.$test1($t);
    return $this.$matched0 ? 0 : 1;
},
jm_Multiplication = $rt_classWithoutFields(),
jm_Multiplication_tenPows = null,
jm_Multiplication_fivePows = null,
jm_Multiplication_bigTenPows = null,
jm_Multiplication_bigFivePows = null,
jm_Multiplication_$callClinit = () => {
    jm_Multiplication_$callClinit = $rt_eraseClinit(jm_Multiplication);
    jm_Multiplication__clinit_();
},
jm_Multiplication_multiply = ($x, $y) => {
    jm_Multiplication_$callClinit();
    return jm_Multiplication_karatsuba($x, $y);
},
jm_Multiplication_karatsuba = ($op1, $op2) => {
    let var$3, $ndiv2, $upperOp1, $upperOp2, $lowerOp1, $lowerOp2, $upper, $lower, $middle, var$12;
    jm_Multiplication_$callClinit();
    if ($op2.$numberLength <= $op1.$numberLength) {
        var$3 = $op2;
        $op2 = $op1;
        $op1 = var$3;
    }
    if ($op1.$numberLength < 63)
        return jm_Multiplication_multiplyPAP($op2, $op1);
    $ndiv2 = ($op2.$numberLength & (-2)) << 4;
    $upperOp1 = $op2.$shiftRight0($ndiv2);
    $upperOp2 = $op1.$shiftRight0($ndiv2);
    $lowerOp1 = $op2.$subtract0($upperOp1.$shiftLeft0($ndiv2));
    $lowerOp2 = $op1.$subtract0($upperOp2.$shiftLeft0($ndiv2));
    $upper = jm_Multiplication_karatsuba($upperOp1, $upperOp2);
    $lower = jm_Multiplication_karatsuba($lowerOp1, $lowerOp2);
    $middle = jm_Multiplication_karatsuba($upperOp1.$subtract0($lowerOp1), $lowerOp2.$subtract0($upperOp2));
    var$3 = ($middle.$add3($upper)).$add3($lower);
    var$3 = var$3.$shiftLeft0($ndiv2);
    var$12 = $upper.$shiftLeft0($ndiv2 << 1);
    return (var$12.$add3(var$3)).$add3($lower);
},
jm_Multiplication_multiplyPAP = ($a, $b) => {
    let $aLen, $bLen, $resLength, $resSign, $aDigits, $bDigits, $resDigits, $result, $val, $valueLo, $valueHi;
    jm_Multiplication_$callClinit();
    $aLen = $a.$numberLength;
    $bLen = $b.$numberLength;
    $resLength = $aLen + $bLen | 0;
    $resSign = $a.$sign0 == $b.$sign0 ? 1 : (-1);
    if ($resLength != 2) {
        $aDigits = $a.$digits;
        $bDigits = $b.$digits;
        $resDigits = $rt_createIntArray($resLength);
        jm_Multiplication_multArraysPAP($aDigits, $aLen, $bDigits, $bLen, $resDigits);
        $result = jm_BigInteger__init_($resSign, $resLength, $resDigits);
        jm_BigInteger_cutOffLeadingZeroes($result);
        return $result;
    }
    $val = jm_Multiplication_unsignedMultAddAdd($a.$digits.data[0], $b.$digits.data[0], 0, 0);
    $valueLo = Long_lo($val);
    $valueHi = Long_hi($val);
    return !$valueHi ? jm_BigInteger__init_0($resSign, $valueLo) : jm_BigInteger__init_($resSign, 2, $rt_createIntArrayFromData([$valueLo, $valueHi]));
},
jm_Multiplication_multArraysPAP = ($aDigits, $aLen, $bDigits, $bLen, $resDigits) => {
    jm_Multiplication_$callClinit();
    if ($aLen && $bLen) {
        if ($aLen == 1)
            $resDigits.data[$bLen] = jm_Multiplication_multiplyByInt($resDigits, $bDigits, $bLen, $aDigits.data[0]);
        else if ($bLen != 1)
            jm_Multiplication_multPAP($aDigits, $bDigits, $resDigits, $aLen, $bLen);
        else
            $resDigits.data[$aLen] = jm_Multiplication_multiplyByInt($resDigits, $aDigits, $aLen, $bDigits.data[0]);
        return;
    }
},
jm_Multiplication_multPAP = ($a, $b, $t, $aLen, $bLen) => {
    let $i, var$7, $carry, $aI, $j, var$11, var$12, var$13, var$14;
    jm_Multiplication_$callClinit();
    if ($a === $b && $aLen == $bLen) {
        jm_Multiplication_square($a, $aLen, $t);
        return;
    }
    $i = 0;
    while ($i < $aLen) {
        var$7 = $a.data;
        $carry = Long_ZERO;
        $aI = var$7[$i];
        $j = 0;
        while ($j < $bLen) {
            var$11 = $t.data;
            var$12 = $b.data[$j];
            var$13 = $i + $j | 0;
            var$14 = jm_Multiplication_unsignedMultAddAdd($aI, var$12, var$11[var$13], Long_lo($carry));
            var$11[var$13] = Long_lo(var$14);
            $carry = Long_shru(var$14, 32);
            $j = $j + 1 | 0;
        }
        $t.data[$i + $bLen | 0] = Long_lo($carry);
        $i = $i + 1 | 0;
    }
},
jm_Multiplication_multiplyByInt = ($res, $a, $aSize, $factor) => {
    let $carry, $i, var$7, var$8;
    jm_Multiplication_$callClinit();
    $carry = Long_ZERO;
    $i = 0;
    while ($i < $aSize) {
        var$7 = $res.data;
        var$8 = jm_Multiplication_unsignedMultAddAdd($a.data[$i], $factor, Long_lo($carry), 0);
        var$7[$i] = Long_lo(var$8);
        $carry = Long_shru(var$8, 32);
        $i = $i + 1 | 0;
    }
    return Long_lo($carry);
},
jm_Multiplication_multiplyByInt0 = ($a, $aSize, $factor) => {
    jm_Multiplication_$callClinit();
    return jm_Multiplication_multiplyByInt($a, $a, $aSize, $factor);
},
jm_Multiplication_multiplyByPositiveInt = ($val, $factor) => {
    let $resSign, $aNumberLength, $aDigits, $resLength, $resDigits, var$8, $result, $res, $resLo, $resHi;
    jm_Multiplication_$callClinit();
    $resSign = $val.$sign0;
    if (!$resSign) {
        jm_BigInteger_$callClinit();
        return jm_BigInteger_ZERO;
    }
    $aNumberLength = $val.$numberLength;
    $aDigits = $val.$digits;
    if ($aNumberLength != 1) {
        $resLength = $aNumberLength + 1 | 0;
        $resDigits = $rt_createIntArray($resLength);
        var$8 = $resDigits.data;
        var$8[$aNumberLength] = jm_Multiplication_multiplyByInt($resDigits, $aDigits, $aNumberLength, $factor);
        $result = jm_BigInteger__init_($resSign, $resLength, $resDigits);
        jm_BigInteger_cutOffLeadingZeroes($result);
        return $result;
    }
    $res = jm_Multiplication_unsignedMultAddAdd($aDigits.data[0], $factor, 0, 0);
    $resLo = Long_lo($res);
    $resHi = Long_hi($res);
    return !$resHi ? jm_BigInteger__init_0($resSign, $resLo) : jm_BigInteger__init_($resSign, 2, $rt_createIntArrayFromData([$resLo, $resHi]));
},
jm_Multiplication_pow = ($acc, $exponent) => {
    let $res, $acc_0, var$5;
    jm_Multiplication_$callClinit();
    jm_BigInteger_$callClinit();
    $res = jm_BigInteger_ONE;
    while ($exponent > 1) {
        if ($exponent & 1)
            $res = $res.$multiply1($acc);
        $acc_0 = $acc.$numberLength == 1 ? $acc.$multiply1($acc) : jm_BigInteger__init_8(1, jm_Multiplication_square($acc.$digits, $acc.$numberLength, $rt_createIntArray($acc.$numberLength << 1)));
        $exponent = $exponent >> 1;
        $acc = $acc_0;
    }
    var$5 = $res.$multiply1($acc);
    return var$5;
},
jm_Multiplication_square = ($a, $aLen, $res) => {
    let $i, $carry, $i_0, $j, var$8, var$9, var$10, var$11, var$12, var$13, $index;
    jm_Multiplication_$callClinit();
    $i = 0;
    while ($i < $aLen) {
        $carry = Long_ZERO;
        $i_0 = $i + 1 | 0;
        $j = $i_0;
        while ($j < $aLen) {
            var$8 = $res.data;
            var$9 = $a.data;
            var$10 = var$9[$i];
            var$11 = var$9[$j];
            var$12 = $i + $j | 0;
            var$13 = jm_Multiplication_unsignedMultAddAdd(var$10, var$11, var$8[var$12], Long_lo($carry));
            var$8[var$12] = Long_lo(var$13);
            $carry = Long_shru(var$13, 32);
            $j = $j + 1 | 0;
        }
        $res.data[$i + $aLen | 0] = Long_lo($carry);
        $i = $i_0;
    }
    jm_BitLevel_shiftLeftOneBit($res, $res, $aLen << 1);
    $carry = Long_ZERO;
    $i = 0;
    $index = 0;
    while ($i < $aLen) {
        var$8 = $res.data;
        var$9 = $a.data;
        var$13 = jm_Multiplication_unsignedMultAddAdd(var$9[$i], var$9[$i], var$8[$index], Long_lo($carry));
        var$8[$index] = Long_lo(var$13);
        var$13 = Long_shru(var$13, 32);
        var$11 = $index + 1 | 0;
        var$13 = Long_add(var$13, Long_and(Long_fromInt(var$8[var$11]), Long_create(4294967295, 0)));
        var$8[var$11] = Long_lo(var$13);
        $carry = Long_shru(var$13, 32);
        $i = $i + 1 | 0;
        $index = var$11 + 1 | 0;
    }
    return $res;
},
jm_Multiplication_multiplyByTenPow = ($val, $exp) => {
    jm_Multiplication_$callClinit();
    return Long_ge($exp, Long_fromInt(jm_Multiplication_tenPows.data.length)) ? $val.$multiply1(jm_Multiplication_powerOf10($exp)) : jm_Multiplication_multiplyByPositiveInt($val, jm_Multiplication_tenPows.data[Long_lo($exp)]);
},
jm_Multiplication_powerOf10 = $exp => {
    let $intExp, $byteArraySize, $powerOfFive, $longExp, var$6, var$7, var$8;
    jm_Multiplication_$callClinit();
    $intExp = Long_lo($exp);
    if (Long_lt($exp, Long_fromInt(jm_Multiplication_bigTenPows.data.length)))
        return jm_Multiplication_bigTenPows.data[$intExp];
    if (Long_le($exp, Long_fromInt(50))) {
        jm_BigInteger_$callClinit();
        return jm_BigInteger_TEN.$pow1($intExp);
    }
    if (Long_le($exp, Long_fromInt(1000)))
        return (jm_Multiplication_bigFivePows.data[1].$pow1($intExp)).$shiftLeft0($intExp);
    $byteArraySize = Long_add(Long_fromInt(1), Long_fromNumber(Long_toNumber($exp) / 2.4082399653118496));
    if (Long_gt($byteArraySize, Long_fromInt(1000000)))
        $rt_throw(jl_ArithmeticException__init_($rt_s(171)));
    if (Long_le($exp, Long_fromInt(2147483647)))
        return (jm_Multiplication_bigFivePows.data[1].$pow1($intExp)).$shiftLeft0($intExp);
    $powerOfFive = jm_Multiplication_bigFivePows.data[1].$pow1(2147483647);
    $longExp = Long_sub($exp, Long_fromInt(2147483647));
    var$6 = Long_lo(Long_rem($exp, Long_fromInt(2147483647)));
    var$7 = $powerOfFive;
    var$8 = $longExp;
    while (Long_gt(var$8, Long_fromInt(2147483647))) {
        var$7 = var$7.$multiply1($powerOfFive);
        var$8 = Long_sub(var$8, Long_fromInt(2147483647));
    }
    var$7 = var$7.$multiply1(jm_Multiplication_bigFivePows.data[1].$pow1(var$6));
    var$7 = var$7.$shiftLeft0(2147483647);
    while (Long_gt($longExp, Long_fromInt(2147483647))) {
        var$7 = var$7.$shiftLeft0(2147483647);
        $longExp = Long_sub($longExp, Long_fromInt(2147483647));
    }
    var$7 = var$7.$shiftLeft0(var$6);
    return var$7;
},
jm_Multiplication_unsignedMultAddAdd = ($a, $b, $c, $d) => {
    jm_Multiplication_$callClinit();
    return Long_add(Long_add(Long_mul(Long_and(Long_fromInt($a), Long_create(4294967295, 0)), Long_and(Long_fromInt($b), Long_create(4294967295, 0))), Long_and(Long_fromInt($c), Long_create(4294967295, 0))), Long_and(Long_fromInt($d), Long_create(4294967295, 0)));
},
jm_Multiplication__clinit_ = () => {
    let $fivePow, $i, var$3, var$4, var$5;
    jm_Multiplication_tenPows = $rt_createIntArrayFromData([1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000]);
    jm_Multiplication_fivePows = $rt_createIntArrayFromData([1, 5, 25, 125, 625, 3125, 15625, 78125, 390625, 1953125, 9765625, 48828125, 244140625, 1220703125]);
    jm_Multiplication_bigTenPows = $rt_createArray(jm_BigInteger, 32);
    jm_Multiplication_bigFivePows = $rt_createArray(jm_BigInteger, 32);
    $fivePow = Long_fromInt(1);
    $i = 0;
    while ($i <= 18) {
        jm_Multiplication_bigFivePows.data[$i] = jm_BigInteger_valueOf($fivePow);
        jm_Multiplication_bigTenPows.data[$i] = jm_BigInteger_valueOf(Long_shl($fivePow, $i));
        $fivePow = Long_mul($fivePow, Long_fromInt(5));
        $i = $i + 1 | 0;
    }
    while ($i < jm_Multiplication_bigTenPows.data.length) {
        var$3 = jm_Multiplication_bigFivePows.data;
        var$4 = jm_Multiplication_bigFivePows.data;
        var$5 = $i - 1 | 0;
        var$3[$i] = var$4[var$5].$multiply1(jm_Multiplication_bigFivePows.data[1]);
        jm_Multiplication_bigTenPows.data[$i] = jm_Multiplication_bigTenPows.data[var$5].$multiply1(jm_BigInteger_TEN);
        $i = $i + 1 | 0;
    }
};
function ju_TemplateCollections$NEtriesMap$1() {
    ju_TemplateCollections$AbstractImmutableSet.call(this);
    this.$this$00 = null;
}
let ju_TemplateCollections$NEtriesMap$1__init_ = ($this, $this$0) => {
    $this.$this$00 = $this$0;
    ju_TemplateCollections$AbstractImmutableSet__init_($this);
},
ju_TemplateCollections$NEtriesMap$1__init_0 = var_0 => {
    let var_1 = new ju_TemplateCollections$NEtriesMap$1();
    ju_TemplateCollections$NEtriesMap$1__init_(var_1, var_0);
    return var_1;
},
ju_TemplateCollections$NEtriesMap$1_iterator = $this => {
    return ju_TemplateCollections$NEtriesMap$1$1__init_0($this);
},
ju_Dictionary = $rt_classWithoutFields(),
ju_Dictionary__init_ = $this => {
    jl_Object__init_($this);
},
oajqg_Toffoli = $rt_classWithoutFields(oajqg_Gate),
oajqg_Toffoli__init_ = ($this, $firstQubit, $secondQubit, $thirdQubit) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 3, oaju_Constants_TOFFOLI_MATRIX, $rt_s(25), $rt_wrapArray(jl_Integer, [$firstQubit, $secondQubit, $thirdQubit]));
},
oajqg_Toffoli__init_0 = (var_0, var_1, var_2) => {
    let var_3 = new oajqg_Toffoli();
    oajqg_Toffoli__init_(var_3, var_0, var_1, var_2);
    return var_3;
},
otrf_VirtualFileSystemProvider = $rt_classWithoutFields(),
otrf_VirtualFileSystemProvider_instance = null,
otrf_VirtualFileSystemProvider_getInstance = () => {
    if (otrf_VirtualFileSystemProvider_instance === null)
        otrf_VirtualFileSystemProvider_instance = otrf_VirtualFileSystemProvider_create();
    return otrf_VirtualFileSystemProvider_instance;
},
otrf_VirtualFileSystemProvider_create = () => {
    return otrfm_InMemoryVirtualFileSystem__init_0();
},
oajv_CircuitSpecs$1 = $rt_classWithoutFields(),
oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind = null,
oajv_CircuitSpecs$1_$callClinit = () => {
    oajv_CircuitSpecs$1_$callClinit = $rt_eraseClinit(oajv_CircuitSpecs$1);
    oajv_CircuitSpecs$1__clinit_();
},
oajv_CircuitSpecs$1__clinit_ = () => {
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind = $rt_createIntArray((oajvs_GateKind_values()).data.length);
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_IDENTITY)] = 1;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_H)] = 2;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_X)] = 3;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_Y)] = 4;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_Z)] = 5;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_S)] = 6;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_T)] = 7;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_MEASUREMENT)] = 8;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_RESET)] = 9;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_RX)] = 10;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_RY)] = 11;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_RZ)] = 12;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_PHASE)] = 13;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_U3)] = 14;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_CNOT)] = 15;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_CY)] = 16;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_CZ)] = 17;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_SWAP)] = 18;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_CSWAP)] = 19;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_TOFFOLI)] = 20;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_MULTI_CONTROLLED)] = 21;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_ORACLE)] = 22;
    oajv_CircuitSpecs$1_$SwitchMap$org$aitan$jqapi$visualization$spec$GateKind.data[jl_Enum_ordinal(oajvs_GateKind_GENERIC)] = 23;
};
function ju_HashMap$1() {
    ju_AbstractSet.call(this);
    this.$this$01 = null;
}
let ju_HashMap$1__init_ = ($this, $this$0) => {
    $this.$this$01 = $this$0;
    ju_AbstractSet__init_($this);
},
ju_HashMap$1__init_0 = var_0 => {
    let var_1 = new ju_HashMap$1();
    ju_HashMap$1__init_(var_1, var_0);
    return var_1;
},
ju_HashMap$1_iterator = $this => {
    return ju_HashMap$KeyIterator__init_0($this.$this$01);
};
function jl_Double() {
    jl_Number.call(this);
    this.$value0 = 0.0;
}
let jl_Double_TYPE = null,
jl_Double_$callClinit = () => {
    jl_Double_$callClinit = $rt_eraseClinit(jl_Double);
    jl_Double__clinit_();
},
jl_Double__init_ = ($this, $value) => {
    jl_Double_$callClinit();
    jl_Number__init_($this);
    $this.$value0 = $value;
},
jl_Double__init_0 = var_0 => {
    let var_1 = new jl_Double();
    jl_Double__init_(var_1, var_0);
    return var_1;
},
jl_Double_doubleValue = $this => {
    return $this.$value0;
},
jl_Double_valueOf = $d => {
    jl_Double_$callClinit();
    return jl_Double__init_0($d);
},
jl_Double_toString = $d => {
    jl_Double_$callClinit();
    return ((jl_StringBuilder__init_()).$append10($d)).$toString();
},
jl_Double_parseDouble = $string => {
    let $start, $end, var$4, var$5, $negative, $c, $mantissa, $exp, $hasOneDigit, $mantissaPos, var$12, var$13, $negativeExp, $numExp;
    jl_Double_$callClinit();
    if (jl_String_isEmpty($string))
        $rt_throw(jl_NumberFormatException__init_());
    $start = 0;
    $end = jl_String_length($string);
    while (true) {
        if (jl_String_charAt($string, $start) > 32) {
            while (true) {
                var$4 = $end - 1 | 0;
                if (jl_String_charAt($string, var$4) > 32)
                    break;
                $end = $end + (-1) | 0;
            }
            var$5 = jl_String_charAt($string, var$4) != 102 && jl_String_charAt($string, var$4) != 70 && jl_String_charAt($string, var$4) != 100 && jl_String_charAt($string, var$4) != 68 ? $end : $end + (-1) | 0;
            $negative = 0;
            if (jl_String_charAt($string, $start) == 45) {
                $start = $start + 1 | 0;
                $negative = 1;
            } else if (jl_String_charAt($string, $start) == 43)
                $start = $start + 1 | 0;
            if ($start == var$5)
                $rt_throw(jl_NumberFormatException__init_());
            a: {
                $c = jl_String_charAt($string, $start);
                $mantissa = Long_ZERO;
                $exp = (-1);
                $hasOneDigit = 0;
                $mantissaPos = Long_create(2808348672, 232830643);
                if ($c != 46) {
                    $hasOneDigit = 1;
                    if ($c >= 48 && $c <= 57) {
                        b: {
                            while ($start < var$5) {
                                if (jl_String_charAt($string, $start) != 48)
                                    break b;
                                $start = $start + 1 | 0;
                            }
                        }
                        while ($start < var$5) {
                            var$4 = jl_String_charAt($string, $start);
                            if (var$4 < 48)
                                break a;
                            if (var$4 > 57)
                                break a;
                            if (Long_gt($mantissaPos, Long_ZERO)) {
                                $mantissa = Long_add($mantissa, Long_mul($mantissaPos, Long_fromInt(var$4 - 48 | 0)));
                                $mantissaPos = jl_Long_divideUnsigned($mantissaPos, Long_fromInt(10));
                            }
                            $exp = $exp + 1 | 0;
                            $start = $start + 1 | 0;
                        }
                    } else {
                        if ($c == 73 && ($end - $start | 0) == 8 && jl_String_regionMatches($string, 0, $start, $rt_s(172), 0, 8))
                            return !$negative ? Infinity : (-Infinity);
                        if ($c == 78 && ($end - $start | 0) == 3 && jl_String_regionMatches($string, 0, $start, $rt_s(173), 0, 3))
                            return NaN;
                        $rt_throw(jl_NumberFormatException__init_());
                    }
                }
            }
            if ($start < var$5 && jl_String_charAt($string, $start) == 46) {
                $start = $start + 1 | 0;
                c: {
                    while (true) {
                        if ($start >= var$5)
                            break c;
                        var$12 = jl_String_charAt($string, $start);
                        var$4 = $rt_compare(var$12, 48);
                        if (var$4 < 0)
                            break c;
                        if (var$12 > 57)
                            break;
                        if (Long_eq($mantissa, Long_ZERO) && !var$4)
                            $exp = $exp + (-1) | 0;
                        else if (Long_gt($mantissaPos, Long_ZERO)) {
                            $mantissa = Long_add($mantissa, Long_mul($mantissaPos, Long_fromInt(var$12 - 48 | 0)));
                            $mantissaPos = jl_Long_divideUnsigned($mantissaPos, Long_fromInt(10));
                        }
                        $start = $start + 1 | 0;
                        $hasOneDigit = 1;
                    }
                }
                if (!$hasOneDigit)
                    $rt_throw(jl_NumberFormatException__init_());
            }
            if ($start < var$5) {
                var$12 = jl_String_charAt($string, $start);
                if (var$12 != 101 && var$12 != 69)
                    $rt_throw(jl_NumberFormatException__init_());
                var$13 = $start + 1 | 0;
                $negativeExp = 0;
                if (var$13 == var$5)
                    $rt_throw(jl_NumberFormatException__init_());
                if (jl_String_charAt($string, var$13) == 45) {
                    var$13 = var$13 + 1 | 0;
                    $negativeExp = 1;
                } else if (jl_String_charAt($string, var$13) == 43)
                    var$13 = var$13 + 1 | 0;
                $numExp = 0;
                var$4 = 0;
                d: {
                    while (true) {
                        if (var$13 >= var$5)
                            break d;
                        var$12 = jl_String_charAt($string, var$13);
                        if (var$12 < 48)
                            break d;
                        if (var$12 > 57)
                            break;
                        $numExp = (10 * $numExp | 0) + (var$12 - 48 | 0) | 0;
                        var$4 = 1;
                        var$13 = var$13 + 1 | 0;
                    }
                }
                if (!var$4)
                    $rt_throw(jl_NumberFormatException__init_());
                if ($negativeExp)
                    $numExp =  -$numExp | 0;
                $exp = $exp + $numExp | 0;
            }
            return otcit_DoubleSynthesizer_synthesizeDouble($mantissa, $exp, $negative);
        }
        $start = $start + 1 | 0;
        if ($start == $end)
            break;
    }
    $rt_throw(jl_NumberFormatException__init_());
},
jl_Double_toString0 = $this => {
    return jl_Double_toString($this.$value0);
},
jl_Double_equals0 = ($this, $other) => {
    if ($this === $other)
        return 1;
    return $other instanceof jl_Double && jl_Double_equals($this.$value0, $other.$value0) ? 1 : 0;
},
jl_Double_equals = ($a, $b) => {
    jl_Double_$callClinit();
    return $rt_equalDoubles($a, $b);
},
jl_Double_hashCode0 = $this => {
    return jl_Double_hashCode($this.$value0);
},
jl_Double_hashCode = $d => {
    let $h;
    jl_Double_$callClinit();
    $h = jl_Double_doubleToLongBits($d);
    return Long_hi($h) ^ Long_lo($h);
},
jl_Double_isInfinite = $v => {
    jl_Double_$callClinit();
    return !(isFinite($v) ? 1 : 0) && !(isNaN($v) ? 1 : 0) ? 1 : 0;
},
jl_Double_doubleToLongBits = $value => {
    jl_Double_$callClinit();
    if (!(isNaN($value) ? 1 : 0))
        return $rt_doubleToRawLongBits($value);
    return Long_create(0, 2146959360);
},
jl_Double__clinit_ = () => {
    jl_Double_TYPE = $rt_cls($rt_doublecls);
},
jm_Elementary = $rt_classWithoutFields(),
jm_Elementary_compareArrays = ($a, $b, $size) => {
    let $i, var$5, var$6, var$7;
    $i = $size - 1 | 0;
    while ($i >= 0) {
        var$5 = $b.data;
        if ($a.data[$i] != var$5[$i])
            break;
        $i = $i + (-1) | 0;
    }
    if ($i < 0)
        var$6 = 0;
    else {
        var$7 = $b.data;
        var$6 = Long_ge(Long_and(Long_fromInt($a.data[$i]), Long_create(4294967295, 0)), Long_and(Long_fromInt(var$7[$i]), Long_create(4294967295, 0))) ? 1 : (-1);
    }
    return var$6;
},
jm_Elementary_add1 = ($op1, $op2) => {
    let $op1Sign, $op2Sign, $op1Len, $op2Len, $a, $b, $res, $valueLo, $valueHi, $resDigits, var$13, $cmp, var$15, $res_0;
    $op1Sign = $op1.$sign0;
    $op2Sign = $op2.$sign0;
    if (!$op1Sign)
        return $op2;
    if (!$op2Sign)
        return $op1;
    $op1Len = $op1.$numberLength;
    $op2Len = $op2.$numberLength;
    if (($op1Len + $op2Len | 0) == 2) {
        $a = Long_and(Long_fromInt($op1.$digits.data[0]), Long_create(4294967295, 0));
        $b = Long_and(Long_fromInt($op2.$digits.data[0]), Long_create(4294967295, 0));
        if ($op1Sign != $op2Sign)
            return jm_BigInteger_valueOf($op1Sign >= 0 ? Long_sub($a, $b) : Long_sub($b, $a));
        $res = Long_add($a, $b);
        $valueLo = Long_lo($res);
        $valueHi = Long_hi($res);
        return !$valueHi ? jm_BigInteger__init_0($op1Sign, $valueLo) : jm_BigInteger__init_($op1Sign, 2, $rt_createIntArrayFromData([$valueLo, $valueHi]));
    }
    if ($op1Sign == $op2Sign)
        $resDigits = $op1Len < $op2Len ? jm_Elementary_add($op2.$digits, $op2Len, $op1.$digits, $op1Len) : jm_Elementary_add($op1.$digits, $op1Len, $op2.$digits, $op2Len);
    else {
        var$13 = $rt_compare($op1Len, $op2Len);
        $cmp = !var$13 ? jm_Elementary_compareArrays($op1.$digits, $op2.$digits, $op1Len) : var$13 <= 0 ? (-1) : 1;
        if (!$cmp) {
            jm_BigInteger_$callClinit();
            return jm_BigInteger_ZERO;
        }
        if ($cmp != 1) {
            $resDigits = jm_Elementary_subtract($op2.$digits, $op2Len, $op1.$digits, $op1Len);
            $op1Sign = $op2Sign;
        } else
            $resDigits = jm_Elementary_subtract($op1.$digits, $op1Len, $op2.$digits, $op2Len);
    }
    var$15 = $resDigits.data;
    $res_0 = jm_BigInteger__init_($op1Sign, var$15.length, $resDigits);
    jm_BigInteger_cutOffLeadingZeroes($res_0);
    return $res_0;
},
jm_Elementary_add0 = ($res, $a, $aSize, $b, $bSize) => {
    let var$6, var$7, var$8, $carry, var$10, $i, var$12;
    var$6 = $res.data;
    var$7 = $b.data;
    var$8 = $a.data;
    $carry = Long_add(Long_and(Long_fromInt(var$8[0]), Long_create(4294967295, 0)), Long_and(Long_fromInt(var$7[0]), Long_create(4294967295, 0)));
    var$6[0] = Long_lo($carry);
    var$10 = Long_shr($carry, 32);
    if ($aSize < $bSize) {
        $i = 1;
        while ($i < $aSize) {
            var$12 = Long_add(var$10, Long_add(Long_and(Long_fromInt(var$8[$i]), Long_create(4294967295, 0)), Long_and(Long_fromInt(var$7[$i]), Long_create(4294967295, 0))));
            var$6[$i] = Long_lo(var$12);
            var$10 = Long_shr(var$12, 32);
            $i = $i + 1 | 0;
        }
        while ($i < $bSize) {
            var$12 = Long_add(var$10, Long_and(Long_fromInt(var$7[$i]), Long_create(4294967295, 0)));
            var$6[$i] = Long_lo(var$12);
            var$10 = Long_shr(var$12, 32);
            $i = $i + 1 | 0;
        }
    } else {
        $i = 1;
        while ($i < $bSize) {
            var$12 = Long_add(var$10, Long_add(Long_and(Long_fromInt(var$8[$i]), Long_create(4294967295, 0)), Long_and(Long_fromInt(var$7[$i]), Long_create(4294967295, 0))));
            var$6[$i] = Long_lo(var$12);
            var$10 = Long_shr(var$12, 32);
            $i = $i + 1 | 0;
        }
        while ($i < $aSize) {
            var$12 = Long_add(var$10, Long_and(Long_fromInt(var$8[$i]), Long_create(4294967295, 0)));
            var$6[$i] = Long_lo(var$12);
            var$10 = Long_shr(var$12, 32);
            $i = $i + 1 | 0;
        }
    }
    if (Long_ne(var$10, Long_ZERO))
        var$6[$i] = Long_lo(var$10);
},
jm_Elementary_subtract0 = ($op1, $op2) => {
    let $op1Sign, $op2Sign, $op1Len, $op2Len, $a, $b, var$9, $cmp, $resSign, $resDigits, var$13, $res;
    $op1Sign = $op1.$sign0;
    $op2Sign = $op2.$sign0;
    if (!$op2Sign)
        return $op1;
    if (!$op1Sign)
        return $op2.$negate();
    $op1Len = $op1.$numberLength;
    $op2Len = $op2.$numberLength;
    if (($op1Len + $op2Len | 0) == 2) {
        $a = Long_and(Long_fromInt($op1.$digits.data[0]), Long_create(4294967295, 0));
        $b = Long_and(Long_fromInt($op2.$digits.data[0]), Long_create(4294967295, 0));
        if ($op1Sign < 0)
            $a = Long_neg($a);
        if ($op2Sign < 0)
            $b = Long_neg($b);
        return jm_BigInteger_valueOf(Long_sub($a, $b));
    }
    var$9 = $rt_compare($op1Len, $op2Len);
    $cmp = !var$9 ? jm_Elementary_compareArrays($op1.$digits, $op2.$digits, $op1Len) : var$9 <= 0 ? (-1) : 1;
    if ($cmp == (-1)) {
        $resSign =  -$op2Sign | 0;
        $resDigits = $op1Sign != $op2Sign ? jm_Elementary_add($op2.$digits, $op2Len, $op1.$digits, $op1Len) : jm_Elementary_subtract($op2.$digits, $op2Len, $op1.$digits, $op1Len);
    } else if ($op1Sign != $op2Sign) {
        $resDigits = jm_Elementary_add($op1.$digits, $op1Len, $op2.$digits, $op2Len);
        $resSign = $op1Sign;
    } else {
        if (!$cmp) {
            jm_BigInteger_$callClinit();
            return jm_BigInteger_ZERO;
        }
        $resDigits = jm_Elementary_subtract($op1.$digits, $op1Len, $op2.$digits, $op2Len);
        $resSign = $op1Sign;
    }
    var$13 = $resDigits.data;
    $res = jm_BigInteger__init_($resSign, var$13.length, $resDigits);
    jm_BigInteger_cutOffLeadingZeroes($res);
    return $res;
},
jm_Elementary_subtract1 = ($res, $a, $aSize, $b, $bSize) => {
    let $borrow, $i, var$8, var$9, var$10;
    $borrow = Long_ZERO;
    $i = 0;
    while ($i < $bSize) {
        var$8 = $res.data;
        var$9 = $b.data;
        var$10 = Long_add($borrow, Long_sub(Long_and(Long_fromInt($a.data[$i]), Long_create(4294967295, 0)), Long_and(Long_fromInt(var$9[$i]), Long_create(4294967295, 0))));
        var$8[$i] = Long_lo(var$10);
        $borrow = Long_shr(var$10, 32);
        $i = $i + 1 | 0;
    }
    while ($i < $aSize) {
        var$9 = $res.data;
        var$10 = Long_add($borrow, Long_and(Long_fromInt($a.data[$i]), Long_create(4294967295, 0)));
        var$9[$i] = Long_lo(var$10);
        $borrow = Long_shr(var$10, 32);
        $i = $i + 1 | 0;
    }
},
jm_Elementary_add = ($a, $aSize, $b, $bSize) => {
    let $res;
    $res = $rt_createIntArray($aSize + 1 | 0);
    jm_Elementary_add0($res, $a, $aSize, $b, $bSize);
    return $res;
},
jm_Elementary_inplaceAdd = ($a, $aSize, $addend) => {
    let $carry, $i, var$6, var$7;
    $carry = Long_and(Long_fromInt($addend), Long_create(4294967295, 0));
    $i = 0;
    while (Long_ne($carry, Long_ZERO) && $i < $aSize) {
        var$6 = $a.data;
        var$7 = Long_add($carry, Long_and(Long_fromInt(var$6[$i]), Long_create(4294967295, 0)));
        var$6[$i] = Long_lo(var$7);
        $carry = Long_shr(var$7, 32);
        $i = $i + 1 | 0;
    }
    return Long_lo($carry);
},
jm_Elementary_subtract = ($a, $aSize, $b, $bSize) => {
    let $res;
    $res = $rt_createIntArray($aSize);
    jm_Elementary_subtract1($res, $a, $aSize, $b, $bSize);
    return $res;
},
oajqs_SamplingOptions$_init_$lambda$_0_0 = $rt_classWithoutFields(),
oajqs_SamplingOptions$_init_$lambda$_0_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
oajqs_SamplingOptions$_init_$lambda$_0_0__init_0 = () => {
    let var_0 = new oajqs_SamplingOptions$_init_$lambda$_0_0();
    oajqs_SamplingOptions$_init_$lambda$_0_0__init_(var_0);
    return var_0;
},
oajqs_SamplingOptions$_init_$lambda$_0_0_get0 = var$0 => {
    return oajqs_SamplingOptions$_init_$lambda$_0_0_get(var$0);
},
oajqs_SamplingOptions$_init_$lambda$_0_0_get = var$0 => {
    return oajqs_SamplingOptions_lambda$new$0();
};
function ju_TemplateCollections$ImmutableEntry() {
    let a = this; jl_Object.call(a);
    a.$key0 = null;
    a.$value2 = null;
}
let ju_TemplateCollections$ImmutableEntry__init_ = ($this, $theKey, $theValue) => {
    jl_Object__init_($this);
    $this.$key0 = $theKey;
    $this.$value2 = $theValue;
},
ju_TemplateCollections$ImmutableEntry__init_0 = (var_0, var_1) => {
    let var_2 = new ju_TemplateCollections$ImmutableEntry();
    ju_TemplateCollections$ImmutableEntry__init_(var_2, var_0, var_1);
    return var_2;
},
ju_TemplateCollections$ImmutableEntry_equals = ($this, $object) => {
    let $entry;
    if ($this === $object)
        return 1;
    if (!$rt_isInstance($object, ju_Map$Entry))
        return 0;
    $entry = $object;
    return ju_Objects_equals($this.$key0, $entry.$getKey()) && ju_Objects_equals($this.$value2, $entry.$getValue()) ? 1 : 0;
},
ju_TemplateCollections$ImmutableEntry_getKey = $this => {
    return $this.$key0;
},
ju_TemplateCollections$ImmutableEntry_getValue = $this => {
    return $this.$value2;
},
ju_TemplateCollections$ImmutableEntry_hashCode = $this => {
    return ju_Objects_hashCode($this.$key0) ^ ju_Objects_hashCode($this.$value2);
},
ju_TemplateCollections$ImmutableEntry_toString = $this => {
    let var$1, var$2, var$3;
    var$1 = jl_String_valueOf($this.$key0);
    var$2 = jl_String_valueOf($this.$value2);
    var$3 = jl_StringBuilder__init_();
    jl_StringBuilder_append(jl_StringBuilder_append0(jl_StringBuilder_append(var$3, var$1), 61), var$2);
    return jl_StringBuilder_toString(var$3);
};
function ju_ArrayList() {
    let a = this; ju_AbstractList.call(a);
    a.$array = null;
    a.$size1 = 0;
}
let ju_ArrayList__init_3 = $this => {
    ju_ArrayList__init_1($this, 10);
},
ju_ArrayList__init_ = () => {
    let var_0 = new ju_ArrayList();
    ju_ArrayList__init_3(var_0);
    return var_0;
},
ju_ArrayList__init_1 = ($this, $initialCapacity) => {
    ju_AbstractList__init_($this);
    if ($initialCapacity >= 0) {
        $this.$array = $rt_createArray(jl_Object, $initialCapacity);
        return;
    }
    $rt_throw(jl_IllegalArgumentException__init_0());
},
ju_ArrayList__init_0 = var_0 => {
    let var_1 = new ju_ArrayList();
    ju_ArrayList__init_1(var_1, var_0);
    return var_1;
},
ju_ArrayList__init_2 = ($this, $c) => {
    let $iter, $i;
    ju_ArrayList__init_1($this, $c.$size());
    $iter = $c.$iterator();
    $i = 0;
    while ($i < $this.$array.data.length) {
        $this.$array.data[$i] = $iter.$next();
        $i = $i + 1 | 0;
    }
    $this.$size1 = $this.$array.data.length;
},
ju_ArrayList__init_4 = var_0 => {
    let var_1 = new ju_ArrayList();
    ju_ArrayList__init_2(var_1, var_0);
    return var_1;
},
ju_ArrayList_ensureCapacity = ($this, $minCapacity) => {
    let $newLength;
    if ($this.$array.data.length < $minCapacity) {
        $newLength = $this.$array.data.length >= 1073741823 ? 2147483647 : jl_Math_max($minCapacity, jl_Math_max($this.$array.data.length * 2 | 0, 5));
        $this.$array = ju_Arrays_copyOf($this.$array, $newLength);
    }
},
ju_ArrayList_get = ($this, $index) => {
    ju_ArrayList_checkIndex($this, $index);
    return $this.$array.data[$index];
},
ju_ArrayList_size = $this => {
    return $this.$size1;
},
ju_ArrayList_add = ($this, $element) => {
    let var$2, var$3;
    $this.$ensureCapacity($this.$size1 + 1 | 0);
    var$2 = $this.$array.data;
    var$3 = $this.$size1;
    $this.$size1 = var$3 + 1 | 0;
    var$2[var$3] = $element;
    $this.$modCount0 = $this.$modCount0 + 1 | 0;
    return 1;
},
ju_ArrayList_add0 = ($this, $index, $element) => {
    let $i;
    ju_ArrayList_checkIndexForAdd($this, $index);
    $this.$ensureCapacity($this.$size1 + 1 | 0);
    $i = $this.$size1;
    while ($i > $index) {
        $this.$array.data[$i] = $this.$array.data[$i - 1 | 0];
        $i = $i + (-1) | 0;
    }
    $this.$array.data[$index] = $element;
    $this.$size1 = $this.$size1 + 1 | 0;
    $this.$modCount0 = $this.$modCount0 + 1 | 0;
},
ju_ArrayList_checkIndex = ($this, $index) => {
    if ($index >= 0 && $index < $this.$size1)
        return;
    $rt_throw(jl_IndexOutOfBoundsException__init_());
},
ju_ArrayList_checkIndexForAdd = ($this, $index) => {
    if ($index >= 0 && $index <= $this.$size1)
        return;
    $rt_throw(jl_IndexOutOfBoundsException__init_());
},
ju_ArrayList_forEach = ($this, $action) => {
    let $i;
    $i = 0;
    while ($i < $this.$size1) {
        $action.$accept0($this.$array.data[$i]);
        $i = $i + 1 | 0;
    }
},
ju_ArrayList_toString = $this => {
    let $length, $buffer, $i;
    if (!$this.$size1)
        return $rt_s(174);
    $length = $this.$size1 - 1 | 0;
    $buffer = jl_StringBuilder__init_1($this.$size1 * 16 | 0);
    $buffer.$append0(91);
    $i = 0;
    while ($i < $length) {
        ($buffer.$append($this.$array.data[$i] === $this ? $rt_s(56) : $this.$array.data[$i])).$append1($rt_s(57));
        $i = $i + 1 | 0;
    }
    $buffer.$append($this.$array.data[$length] === $this ? $rt_s(56) : $this.$array.data[$length]);
    return ($buffer.$append0(93)).$toString();
},
ju_ArrayList_hashCode = $this => {
    let $result, $i;
    $result = 1;
    $i = 0;
    while ($i < $this.$size1) {
        $result = (31 * $result | 0) + ju_Objects_hashCode($this.$array.data[$i]) | 0;
        $i = $i + 1 | 0;
    }
    return $result;
},
otrf_VirtualFileSystem = $rt_classWithoutFields(0),
jl_IllegalMonitorStateException = $rt_classWithoutFields(jl_RuntimeException),
jl_IllegalMonitorStateException__init_ = $this => {
    jl_RuntimeException__init_($this);
},
jl_IllegalMonitorStateException__init_0 = () => {
    let var_0 = new jl_IllegalMonitorStateException();
    jl_IllegalMonitorStateException__init_(var_0);
    return var_0;
},
ju_LinkedHashMapIterator$EntryIterator = $rt_classWithoutFields(ju_LinkedHashMapIterator),
ju_LinkedHashMapIterator$EntryIterator__init_ = ($this, $map, $reversed) => {
    ju_LinkedHashMapIterator__init_($this, $map, $reversed);
},
ju_LinkedHashMapIterator$EntryIterator__init_0 = (var_0, var_1) => {
    let var_2 = new ju_LinkedHashMapIterator$EntryIterator();
    ju_LinkedHashMapIterator$EntryIterator__init_(var_2, var_0, var_1);
    return var_2;
},
ju_LinkedHashMapIterator$EntryIterator_next = $this => {
    ju_LinkedHashMapIterator_makeNext($this);
    return $this.$currentEntry0;
},
ju_LinkedHashMapIterator$EntryIterator_next0 = $this => {
    return $this.$next1();
},
jm_Division = $rt_classWithoutFields(),
jm_Division_divide = ($quot, $quotLength, $a, $j, $b, $bLength) => {
    let var$7, $normA, $normB, var$10, $divisorShift, var$12, $firstDivisorDigit, $i, var$15, $product, $res, $rem, $rOverflowed, var$20, var$21, var$22, $longR, var$24, $borrow, $carry, $k;
    var$7 = $b.data;
    $normA = $rt_createIntArray($j + 1 | 0);
    $normB = $rt_createIntArray($bLength + 1 | 0);
    var$10 = $bLength - 1 | 0;
    $divisorShift = jl_Integer_numberOfLeadingZeros(var$7[var$10]);
    if ($divisorShift) {
        jm_BitLevel_shiftLeft($normB, $b, 0, $divisorShift);
        jm_BitLevel_shiftLeft($normA, $a, 0, $divisorShift);
    } else {
        jl_System_fastArraycopy($a, 0, $normA, 0, $j);
        jl_System_fastArraycopy($b, 0, $normB, 0, $bLength);
    }
    var$12 = $normB.data;
    $firstDivisorDigit = var$12[var$10];
    $i = $quotLength - 1 | 0;
    while ($i >= 0) {
        a: {
            var$7 = $normA.data;
            if (var$7[$j] == $firstDivisorDigit)
                var$15 = (-1);
            else {
                $product = Long_add(Long_shl(Long_and(Long_fromInt(var$7[$j]), Long_create(4294967295, 0)), 32), Long_and(Long_fromInt(var$7[$j - 1 | 0]), Long_create(4294967295, 0)));
                $res = jm_Division_divideLongByInt($product, $firstDivisorDigit);
                var$15 = Long_lo($res);
                $rem = Long_hi($res);
                if (var$15) {
                    $rOverflowed = 0;
                    var$15 = var$15 + 1 | 0;
                    while (true) {
                        var$15 = var$15 + (-1) | 0;
                        if ($rOverflowed)
                            break;
                        var$20 = Long_mul(Long_and(Long_fromInt(var$15), Long_create(4294967295, 0)), Long_and(Long_fromInt(var$12[$bLength - 2 | 0]), Long_create(4294967295, 0)));
                        var$21 = Long_fromInt($rem);
                        var$22 = Long_add(Long_shl(var$21, 32), Long_and(Long_fromInt(var$7[$j - 2 | 0]), Long_create(4294967295, 0)));
                        $longR = Long_add(Long_and(var$21, Long_create(4294967295, 0)), Long_and(Long_fromInt($firstDivisorDigit), Long_create(4294967295, 0)));
                        if (jl_Integer_numberOfLeadingZeros(Long_hi($longR)) >= 32)
                            $rem = Long_lo($longR);
                        else
                            $rOverflowed = 1;
                        if (Long_le(Long_xor(var$20, Long_create(0, 2147483648)), Long_xor(var$22, Long_create(0, 2147483648))))
                            break a;
                    }
                }
            }
        }
        if (var$15) {
            var$24 = $j - $bLength | 0;
            $borrow = jm_Division_multiplyAndSubtract($normA, var$24, $normB, $bLength, var$15);
            if ($borrow) {
                var$15 = var$15 + (-1) | 0;
                $carry = Long_ZERO;
                $k = 0;
                while ($k < $bLength) {
                    var$10 = var$24 + $k | 0;
                    var$21 = Long_add($carry, Long_add(Long_and(Long_fromInt(var$7[var$10]), Long_create(4294967295, 0)), Long_and(Long_fromInt(var$12[$k]), Long_create(4294967295, 0))));
                    var$7[var$10] = Long_lo(var$21);
                    $carry = Long_shru(var$21, 32);
                    $k = $k + 1 | 0;
                }
            }
        }
        if ($quot !== null)
            $quot.data[$i] = var$15;
        $j = $j + (-1) | 0;
        $i = $i + (-1) | 0;
    }
    if ($divisorShift) {
        jm_BitLevel_shiftRight0($normB, $bLength, $normA, 0, $divisorShift);
        return $normB;
    }
    jl_System_fastArraycopy($normA, 0, $normB, 0, $bLength);
    return $normA;
},
jm_Division_divideArrayByInt = ($dest, $src, $srcLength, $divisor) => {
    let $rem, $bLong, $i, var$8, $temp, $quot, $aPos, $bPos, var$13;
    $rem = Long_ZERO;
    $bLong = Long_and(Long_fromInt($divisor), Long_create(4294967295, 0));
    $i = $srcLength - 1 | 0;
    while ($i >= 0) {
        var$8 = $src.data;
        $temp = Long_or(Long_shl($rem, 32), Long_and(Long_fromInt(var$8[$i]), Long_create(4294967295, 0)));
        if (Long_ge($temp, Long_ZERO)) {
            $quot = Long_div($temp, $bLong);
            $rem = Long_rem($temp, $bLong);
        } else {
            $aPos = Long_shru($temp, 1);
            $bPos = Long_fromInt($divisor >>> 1 | 0);
            $quot = Long_div($aPos, $bPos);
            var$13 = Long_rem($aPos, $bPos);
            $rem = Long_add(Long_shl(var$13, 1), Long_and($temp, Long_fromInt(1)));
            if ($divisor & 1) {
                if (Long_le($quot, $rem))
                    $rem = Long_sub($rem, $quot);
                else if (Long_le(Long_sub($quot, $rem), $bLong)) {
                    $rem = Long_add($rem, Long_sub($bLong, $quot));
                    $quot = Long_sub($quot, Long_fromInt(1));
                } else {
                    $rem = Long_add($rem, Long_sub(Long_shl($bLong, 1), $quot));
                    $quot = Long_sub($quot, Long_fromInt(2));
                }
            }
        }
        $dest.data[$i] = Long_lo(Long_and($quot, Long_create(4294967295, 0)));
        $i = $i + (-1) | 0;
    }
    return Long_lo($rem);
},
jm_Division_divideLongByInt = ($a, $b) => {
    let $bLong, $quot, $rem, $aPos, $bPos;
    $bLong = Long_and(Long_fromInt($b), Long_create(4294967295, 0));
    if (Long_ge($a, Long_ZERO)) {
        $quot = Long_div($a, $bLong);
        $rem = Long_rem($a, $bLong);
    } else {
        $aPos = Long_shru($a, 1);
        $bPos = Long_fromInt($b >>> 1 | 0);
        $quot = Long_div($aPos, $bPos);
        $rem = Long_rem($aPos, $bPos);
        $rem = Long_add(Long_shl($rem, 1), Long_and($a, Long_fromInt(1)));
        if ($b & 1) {
            if (Long_le($quot, $rem))
                $rem = Long_sub($rem, $quot);
            else if (Long_le(Long_sub($quot, $rem), $bLong)) {
                $rem = Long_add($rem, Long_sub($bLong, $quot));
                $quot = Long_sub($quot, Long_fromInt(1));
            } else {
                $rem = Long_add($rem, Long_sub(Long_shl($bLong, 1), $quot));
                $quot = Long_sub($quot, Long_fromInt(2));
            }
        }
    }
    return Long_or(Long_shl($rem, 32), Long_and($quot, Long_create(4294967295, 0)));
},
jm_Division_divideAndRemainderByInteger = ($val, $divisor, $divisorSign) => {
    let $valDigits, $valLen, $valSign, $quotientSign, $quotientDigits, $remainderDigits, $result0, $result1, $a, $b, $quo, $rem, var$16, var$17;
    $valDigits = $val.$digits;
    $valLen = $val.$numberLength;
    $valSign = $val.$sign0;
    if ($valLen != 1) {
        $quotientSign = $valSign != $divisorSign ? (-1) : 1;
        $quotientDigits = $rt_createIntArray($valLen);
        $remainderDigits = $rt_createIntArray(1);
        $remainderDigits.data[0] = jm_Division_divideArrayByInt($quotientDigits, $valDigits, $valLen, $divisor);
        $result0 = jm_BigInteger__init_($quotientSign, $valLen, $quotientDigits);
        $result1 = jm_BigInteger__init_($valSign, 1, $remainderDigits);
        jm_BigInteger_cutOffLeadingZeroes($result0);
        jm_BigInteger_cutOffLeadingZeroes($result1);
        return $rt_wrapArray(jm_BigInteger, [$result0, $result1]);
    }
    $a = Long_and(Long_fromInt($valDigits.data[0]), Long_create(4294967295, 0));
    $b = Long_and(Long_fromInt($divisor), Long_create(4294967295, 0));
    $quo = Long_div($a, $b);
    $rem = Long_rem($a, $b);
    if ($valSign != $divisorSign)
        $quo = Long_neg($quo);
    if ($valSign < 0)
        $rem = Long_neg($rem);
    var$16 = $rt_createArray(jm_BigInteger, 2);
    var$17 = var$16.data;
    var$17[0] = jm_BigInteger_valueOf($quo);
    var$17[1] = jm_BigInteger_valueOf($rem);
    return var$16;
},
jm_Division_multiplyAndSubtract = ($a, $start, $b, $bLen, $c) => {
    let $carry0, $carry1, $i, var$9, var$10, var$11, var$12, var$13, var$14;
    $carry0 = Long_ZERO;
    $carry1 = Long_ZERO;
    $i = 0;
    while ($i < $bLen) {
        var$9 = $a.data;
        var$10 = jm_Multiplication_unsignedMultAddAdd($b.data[$i], $c, Long_lo($carry0), 0);
        var$11 = $start + $i | 0;
        var$12 = Long_add(Long_sub(Long_and(Long_fromInt(var$9[var$11]), Long_create(4294967295, 0)), Long_and(var$10, Long_create(4294967295, 0))), $carry1);
        var$9[var$11] = Long_lo(var$12);
        $carry1 = Long_shr(var$12, 32);
        $carry0 = Long_shru(var$10, 32);
        $i = $i + 1 | 0;
    }
    var$13 = $a.data;
    var$14 = $start + $bLen | 0;
    var$12 = Long_add(Long_sub(Long_and(Long_fromInt(var$13[var$14]), Long_create(4294967295, 0)), $carry0), $carry1);
    var$13[var$14] = Long_lo(var$12);
    return Long_hi(var$12);
},
jm_BitLevel = $rt_classWithoutFields(),
jm_BitLevel_bitLength = $val => {
    let $bLength, $highDigit, $i, var$5;
    if (!$val.$sign0)
        return 0;
    $bLength = $val.$numberLength << 5;
    $highDigit = $val.$digits.data[$val.$numberLength - 1 | 0];
    if ($val.$sign0 < 0) {
        $i = $val.$getFirstNonzeroDigit();
        if ($i == ($val.$numberLength - 1 | 0))
            $highDigit = $highDigit + (-1) | 0;
    }
    var$5 = $bLength - jl_Integer_numberOfLeadingZeros($highDigit) | 0;
    return var$5;
},
jm_BitLevel_shiftLeft0 = ($source, $count) => {
    let $intCount, var$4, $resLength, $resDigits, $result;
    $intCount = $count >> 5;
    var$4 = $count & 31;
    $resLength = ($source.$numberLength + $intCount | 0) + (var$4 ? 1 : 0) | 0;
    $resDigits = $rt_createIntArray($resLength);
    jm_BitLevel_shiftLeft($resDigits, $source.$digits, $intCount, var$4);
    $result = jm_BigInteger__init_($source.$sign0, $resLength, $resDigits);
    jm_BigInteger_cutOffLeadingZeroes($result);
    return $result;
},
jm_BitLevel_shiftLeft = ($result, $source, $intCount, $count) => {
    let var$5, $rightShiftCount, $i, var$8, var$9, var$10;
    a: {
        if (!$count)
            jl_System_fastArraycopy($source, 0, $result, $intCount, $result.data.length - $intCount | 0);
        else {
            var$5 = $result.data;
            $rightShiftCount = 32 - $count | 0;
            $i = var$5.length - 1 | 0;
            var$5[$i] = 0;
            while (true) {
                if ($i <= $intCount)
                    break a;
                var$8 = $source.data;
                var$9 = var$5[$i];
                var$10 = ($i - $intCount | 0) - 1 | 0;
                var$5[$i] = var$9 | (var$8[var$10] >>> $rightShiftCount | 0);
                var$5[$i - 1 | 0] = var$8[var$10] << $count;
                $i = $i + (-1) | 0;
            }
        }
    }
    $i = 0;
    while ($i < $intCount) {
        $result.data[$i] = 0;
        $i = $i + 1 | 0;
    }
},
jm_BitLevel_shiftLeftOneBit = ($result, $source, $srcLen) => {
    let $carry, $i, var$6, $val;
    $carry = 0;
    $i = 0;
    while ($i < $srcLen) {
        var$6 = $result.data;
        $val = $source.data[$i];
        var$6[$i] = $val << 1 | $carry;
        $carry = $val >>> 31 | 0;
        $i = $i + 1 | 0;
    }
    if ($carry)
        $result.data[$srcLen] = $carry;
},
jm_BitLevel_shiftLeftOneBit0 = $source => {
    let $srcLen, $resLen, $resDigits, $result;
    $srcLen = $source.$numberLength;
    $resLen = $srcLen + 1 | 0;
    $resDigits = $rt_createIntArray($resLen);
    jm_BitLevel_shiftLeftOneBit($resDigits, $source.$digits, $srcLen);
    $result = jm_BigInteger__init_($source.$sign0, $resLen, $resDigits);
    jm_BigInteger_cutOffLeadingZeroes($result);
    return $result;
},
jm_BitLevel_shiftRight = ($source, $count) => {
    let $intCount, var$4, var$5, $resLength, var$7, $resDigits, $i, var$10, var$11, var$12, $result;
    $intCount = $count >> 5;
    var$4 = $count & 31;
    if ($intCount >= $source.$numberLength) {
        if ($source.$sign0 >= 0) {
            jm_BigInteger_$callClinit();
            var$5 = jm_BigInteger_ZERO;
        } else {
            jm_BigInteger_$callClinit();
            var$5 = jm_BigInteger_MINUS_ONE;
        }
        return var$5;
    }
    a: {
        $resLength = $source.$numberLength - $intCount | 0;
        var$7 = $resLength + 1 | 0;
        $resDigits = $rt_createIntArray(var$7);
        jm_BitLevel_shiftRight0($resDigits, $resLength, $source.$digits, $intCount, var$4);
        if ($source.$sign0 >= 0)
            var$7 = $resLength;
        else {
            $i = 0;
            while (true) {
                var$10 = $rt_compare($i, $intCount);
                if (var$10 >= 0)
                    break;
                if ($source.$digits.data[$i])
                    break;
                $i = $i + 1 | 0;
            }
            if (var$10 >= 0) {
                if (var$4 <= 0) {
                    var$7 = $resLength;
                    break a;
                }
                if (!($source.$digits.data[$i] << (32 - var$4 | 0))) {
                    var$7 = $resLength;
                    break a;
                }
            }
            var$4 = 0;
            while (true) {
                var$11 = $rt_compare(var$4, $resLength);
                if (var$11 >= 0)
                    break;
                var$12 = $resDigits.data;
                if (var$12[var$4] != (-1))
                    break;
                var$12[var$4] = 0;
                var$4 = var$4 + 1 | 0;
            }
            if (var$11)
                var$7 = $resLength;
            var$12 = $resDigits.data;
            var$12[var$4] = var$12[var$4] + 1 | 0;
        }
    }
    $result = jm_BigInteger__init_($source.$sign0, var$7, $resDigits);
    jm_BigInteger_cutOffLeadingZeroes($result);
    return $result;
},
jm_BitLevel_shiftRight0 = ($result, $resultLen, $source, $intCount, $count) => {
    let $allZero, $i, var$8, $leftShiftCount, var$10, var$11, var$12;
    $allZero = 1;
    $i = 0;
    while ($i < $intCount) {
        $allZero = $allZero & ($source.data[$i] ? 0 : 1);
        $i = $i + 1 | 0;
    }
    if (!$count)
        jl_System_fastArraycopy($source, $intCount, $result, 0, $resultLen);
    else {
        var$8 = $source.data;
        $leftShiftCount = 32 - $count | 0;
        $allZero = $allZero & (var$8[$i] << $leftShiftCount ? 0 : 1);
        var$10 = 0;
        while (var$10 < ($resultLen - 1 | 0)) {
            var$11 = $result.data;
            var$12 = var$10 + $intCount | 0;
            var$11[var$10] = (var$8[var$12] >>> $count | 0) | var$8[var$12 + 1 | 0] << $leftShiftCount;
            var$10 = var$10 + 1 | 0;
        }
        $result.data[var$10] = var$8[var$10 + $intCount | 0] >>> $count | 0;
    }
    return $allZero;
},
jusi_SimpleStreamImpl$toArray$lambda$_20_0 = $rt_classWithoutFields(),
jusi_SimpleStreamImpl$toArray$lambda$_20_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jusi_SimpleStreamImpl$toArray$lambda$_20_0__init_0 = () => {
    let var_0 = new jusi_SimpleStreamImpl$toArray$lambda$_20_0();
    jusi_SimpleStreamImpl$toArray$lambda$_20_0__init_(var_0);
    return var_0;
},
jusi_SimpleStreamImpl$toArray$lambda$_20_0_apply0 = (var$0, var$1) => {
    return jusi_SimpleStreamImpl$toArray$lambda$_20_0_apply(var$0, var$1);
},
jusi_SimpleStreamImpl$toArray$lambda$_20_0_apply = (var$0, var$1) => {
    return jusi_SimpleStreamImpl_lambda$toArray$2(var$1);
},
juf_BiConsumer = $rt_classWithoutFields(0);
function jusi_WrappingIntStreamImpl() {
    jusi_SimpleIntStreamImpl.call(this);
    this.$sourceStream0 = null;
}
let jusi_WrappingIntStreamImpl__init_ = ($this, $sourceStream) => {
    jusi_SimpleIntStreamImpl__init_($this);
    $this.$sourceStream0 = $sourceStream;
},
jusi_WrappingIntStreamImpl_next = ($this, $consumer) => {
    return $this.$sourceStream0.$next3($this.$wrap0($consumer));
};
function jl_String() {
    jl_Object.call(this);
    this.$hashCode4 = 0;
}
let jl_String_EMPTY_CHARS = null,
jl_String_EMPTY = null,
jl_String_CASE_INSENSITIVE_ORDER = null,
jl_String_$callClinit = () => {
    jl_String_$callClinit = $rt_eraseClinit(jl_String);
    jl_String__clinit_();
},
jl_String__init_0 = $this => {
    jl_String_$callClinit();
    jl_Object__init_($this);
    $this.$nativeString = "";
},
jl_String__init_6 = () => {
    let var_0 = new jl_String();
    jl_String__init_0(var_0);
    return var_0;
},
jl_String__init_1 = ($this, $characters) => {
    let var$2;
    jl_String_$callClinit();
    var$2 = $characters.data;
    jl_Object__init_($this);
    $this.$nativeString = $rt_charArrayToString($characters.data, 0, var$2.length);
},
jl_String__init_5 = var_0 => {
    let var_1 = new jl_String();
    jl_String__init_1(var_1, var_0);
    return var_1;
},
jl_String__init_3 = (var$0, var$1) => {
    var$0.$nativeString = var$1;
},
jl_String__init_ = var_0 => {
    let var_1 = new jl_String();
    jl_String__init_3(var_1, var_0);
    return var_1;
},
jl_String__init_4 = (var$0, var$1, $offset, $count) => {
    let var$4;
    jl_String_$callClinit();
    var$4 = var$1.data;
    jl_Object__init_(var$0);
    ju_Objects_checkFromIndexSize($offset, $count, var$4.length);
    var$0.$nativeString = $rt_charArrayToString(var$1.data, $offset, $count);
},
jl_String__init_2 = (var_0, var_1, var_2) => {
    let var_3 = new jl_String();
    jl_String__init_4(var_3, var_0, var_1, var_2);
    return var_3;
},
jl_String_charAt = ($this, $index) => {
    if ($index >= 0 && $index < $this.$nativeString.length)
        return $this.$nativeString.charCodeAt($index);
    $rt_throw(jl_StringIndexOutOfBoundsException__init_());
},
jl_String_length = $this => {
    return $this.$nativeString.length;
},
jl_String_isEmpty = $this => {
    return $this.$nativeString.length ? 0 : 1;
},
jl_String_startsWith = ($this, $prefix, $toffset) => {
    let $i, var$4, var$5;
    if (($toffset + jl_String_length($prefix) | 0) > jl_String_length($this))
        return 0;
    $i = 0;
    while ($i < jl_String_length($prefix)) {
        var$4 = jl_String_charAt($prefix, $i);
        var$5 = $toffset + 1 | 0;
        if (var$4 != jl_String_charAt($this, $toffset))
            return 0;
        $i = $i + 1 | 0;
        $toffset = var$5;
    }
    return 1;
},
jl_String_regionMatches = ($this, $ignoreCase, $toffset, $other, $ooffset, $len) => {
    let $i, var$7, $a, var$9, $b;
    if ($toffset >= 0 && $ooffset >= 0 && ($toffset + $len | 0) <= jl_String_length($this) && ($ooffset + $len | 0) <= jl_String_length($other)) {
        $i = 0;
        while ($i < $len) {
            var$7 = $toffset + 1 | 0;
            $a = jl_String_charAt($this, $toffset);
            var$9 = $ooffset + 1 | 0;
            $b = jl_String_charAt($other, $ooffset);
            if ($ignoreCase) {
                $a = jl_Character_toLowerCase($a);
                $b = jl_Character_toLowerCase($b);
            }
            if ($a != $b)
                return 0;
            $i = $i + 1 | 0;
            $toffset = var$7;
            $ooffset = var$9;
        }
        return 1;
    }
    return 0;
},
jl_String_indexOf = ($this, $ch, $fromIndex) => {
    let $i, $bmpChar, $hi, $lo;
    $i = jl_Math_max(0, $fromIndex);
    if ($ch < 65536) {
        $bmpChar = $ch & 65535;
        while (true) {
            if ($i >= $this.$nativeString.length)
                return (-1);
            if ($this.$nativeString.charCodeAt($i) == $bmpChar)
                break;
            $i = $i + 1 | 0;
        }
        return $i;
    }
    $hi = jl_Character_highSurrogate($ch);
    $lo = jl_Character_lowSurrogate($ch);
    while (true) {
        if ($i >= ($this.$nativeString.length - 1 | 0))
            return (-1);
        if ($this.$nativeString.charCodeAt($i) == $hi && $this.$nativeString.charCodeAt(($i + 1 | 0)) == $lo)
            break;
        $i = $i + 1 | 0;
    }
    return $i;
},
jl_String_indexOf0 = ($this, $ch) => {
    return jl_String_indexOf($this, $ch, 0);
},
jl_String_substring = ($this, $beginIndex, $endIndex) => {
    let $length, var$4;
    $length = $this.$nativeString.length;
    var$4 = $rt_compare($beginIndex, $endIndex);
    if (!var$4)
        return jl_String_EMPTY;
    if (!$beginIndex && $endIndex == $length)
        return $this;
    if ($beginIndex >= 0 && var$4 <= 0 && $endIndex <= $length)
        return jl_String__init_($this.$nativeString.substring($beginIndex, $endIndex));
    $rt_throw(jl_StringIndexOutOfBoundsException__init_());
},
jl_String_subSequence = ($this, $beginIndex, $endIndex) => {
    return jl_String_substring($this, $beginIndex, $endIndex);
},
jl_String_toString = $this => {
    return $this;
},
jl_String_toCharArray = $this => {
    let $array, $i, var$3;
    $array = $rt_createCharArray($this.$nativeString.length);
    $i = 0;
    while (true) {
        var$3 = $array.data;
        if ($i >= var$3.length)
            break;
        var$3[$i] = jl_String_charAt($this, $i);
        $i = $i + 1 | 0;
    }
    return $array;
},
jl_String_valueOf = $obj => {
    jl_String_$callClinit();
    return $obj === null ? $rt_s(59) : $obj.$toString();
},
jl_String_valueOf0 = ($data, $offset, $count) => {
    jl_String_$callClinit();
    return jl_String__init_2($data, $offset, $count);
},
jl_String_equals = ($this, $other) => {
    let $str;
    if ($this === $other)
        return 1;
    if (!($other instanceof jl_String))
        return 0;
    $str = $other;
    return $this.$nativeString !== $str.$nativeString ? 0 : 1;
},
jl_String_hashCode = $this => {
    let $i;
    a: {
        if (!$this.$hashCode4) {
            $i = 0;
            while (true) {
                if ($i >= $this.$nativeString.length)
                    break a;
                $this.$hashCode4 = (31 * $this.$hashCode4 | 0) + $this.$nativeString.charCodeAt($i) | 0;
                $i = $i + 1 | 0;
            }
        }
    }
    return $this.$hashCode4;
},
jl_String_toLowerCase = $this => {
    let $lowerCase;
    $lowerCase = $this.$nativeString.toLowerCase();
    if ($lowerCase !== $this.$nativeString)
        $this = jl_String__init_($lowerCase);
    return $this;
},
jl_String__clinit_ = () => {
    jl_String_EMPTY_CHARS = $rt_createCharArray(0);
    jl_String_EMPTY = jl_String__init_6();
    jl_String_CASE_INSENSITIVE_ORDER = jl_String$_clinit_$lambda$_118_0__init_0();
};
function jusi_SimpleStreamImpl$ArrayFillingConsumer() {
    let a = this; jl_Object.call(a);
    a.$array2 = null;
    a.$index0 = 0;
}
let jusi_SimpleStreamImpl$ArrayFillingConsumer__init_ = ($this, $array) => {
    jl_Object__init_($this);
    $this.$array2 = $array;
},
jusi_SimpleStreamImpl$ArrayFillingConsumer__init_0 = var_0 => {
    let var_1 = new jusi_SimpleStreamImpl$ArrayFillingConsumer();
    jusi_SimpleStreamImpl$ArrayFillingConsumer__init_(var_1, var_0);
    return var_1;
},
jusi_SimpleStreamImpl$ArrayFillingConsumer_test = ($this, $t) => {
    let var$2, var$3;
    var$2 = $this.$array2.data;
    var$3 = $this.$index0;
    $this.$index0 = var$3 + 1 | 0;
    var$2[var$3] = $t;
    return 1;
},
jl_NegativeArraySizeException = $rt_classWithoutFields(jl_RuntimeException),
jl_NegativeArraySizeException__init_ = $this => {
    jl_RuntimeException__init_($this);
},
jl_NegativeArraySizeException__init_0 = () => {
    let var_0 = new jl_NegativeArraySizeException();
    jl_NegativeArraySizeException__init_(var_0);
    return var_0;
};
function jusi_MappingStreamImpl$wrap$lambda$_1_0() {
    let a = this; jl_Object.call(a);
    a.$_015 = null;
    a.$_14 = null;
}
let jusi_MappingStreamImpl$wrap$lambda$_1_0__init_ = (var$0, var$1, var$2) => {
    jl_Object__init_(var$0);
    var$0.$_015 = var$1;
    var$0.$_14 = var$2;
},
jusi_MappingStreamImpl$wrap$lambda$_1_0__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_MappingStreamImpl$wrap$lambda$_1_0();
    jusi_MappingStreamImpl$wrap$lambda$_1_0__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_MappingStreamImpl$wrap$lambda$_1_0_test = (var$0, var$1) => {
    return jusi_MappingStreamImpl_lambda$wrap$0(var$0.$_015, var$0.$_14, var$1);
};
function oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0() {
    jl_Object.call(this);
    this.$_019 = null;
}
let oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_019 = var$1;
},
oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0__init_0 = var_0 => {
    let var_1 = new oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0();
    oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0__init_(var_1, var_0);
    return var_1;
},
oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0_accept0 = (var$0, var$1) => {
    oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0_accept(var$0, var$1);
},
oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0_accept = (var$0, var$1) => {
    oajqs_LocalSimulator_lambda$execute$1(var$0.$_019, var$1);
};
function ju_Hashtable() {
    let a = this; ju_Dictionary.call(a);
    a.$elementCount0 = 0;
    a.$elementData0 = null;
    a.$loadFactor = 0.0;
    a.$threshold0 = 0;
    a.$firstSlot = 0;
    a.$lastSlot = 0;
    a.$modCount2 = 0;
}
let ju_Hashtable_EMPTY_ENUMERATION = null,
ju_Hashtable_EMPTY_ITERATOR = null,
ju_Hashtable_$callClinit = () => {
    ju_Hashtable_$callClinit = $rt_eraseClinit(ju_Hashtable);
    ju_Hashtable__clinit_();
},
ju_Hashtable_newEntry = ($key, $value, $hash) => {
    ju_Hashtable_$callClinit();
    return ju_Hashtable$Entry__init_0($key, $value);
},
ju_Hashtable__init_ = $this => {
    ju_Hashtable_$callClinit();
    ju_Hashtable__init_0($this, 11);
},
ju_Hashtable__init_1 = () => {
    let var_0 = new ju_Hashtable();
    ju_Hashtable__init_(var_0);
    return var_0;
},
ju_Hashtable__init_0 = ($this, $capacity) => {
    ju_Hashtable_$callClinit();
    ju_Dictionary__init_($this);
    $this.$lastSlot = (-1);
    if ($capacity < 0)
        $rt_throw(jl_IllegalArgumentException__init_0());
    $this.$elementCount0 = 0;
    if (!$capacity)
        $capacity = 1;
    $this.$elementData0 = ju_Hashtable_newElementArray($this, $capacity);
    $this.$firstSlot = $this.$elementData0.data.length;
    $this.$loadFactor = 0.75;
    ju_Hashtable_computeMaxSize($this);
},
ju_Hashtable__init_2 = var_0 => {
    let var_1 = new ju_Hashtable();
    ju_Hashtable__init_0(var_1, var_0);
    return var_1;
},
ju_Hashtable_newElementArray = ($this, $size) => {
    return $rt_createArray(ju_Hashtable$Entry, $size);
},
ju_Hashtable_computeMaxSize = $this => {
    $this.$threshold0 = $this.$elementData0.data.length * $this.$loadFactor | 0;
},
ju_Hashtable_get = ($this, $key) => {
    let $hash, $index, $entry;
    jl_Object_monitorEnterSync($this);
    try {
        $hash = $key.$hashCode1();
        $index = ($hash & 2147483647) % $this.$elementData0.data.length | 0;
        $entry = $this.$elementData0.data[$index];
        while ($entry !== null) {
            if ($entry.$equalsKey($key, $hash))
                return $entry.$value;
            $entry = $entry.$next5;
        }
        return null;
    } finally {
        jl_Object_monitorExitSync($this);
    }
},
ju_Hashtable_put = ($this, $key, $value) => {
    let $hash, var$4, $index, $entry, $result, var$8, var$9;
    jl_Object_monitorEnterSync($this);
    try {
        if ($key !== null && $value !== null) {
            $hash = $key.$hashCode1();
            var$4 = $hash & 2147483647;
            $index = var$4 % $this.$elementData0.data.length | 0;
            $entry = $this.$elementData0.data[$index];
            while ($entry !== null && !$entry.$equalsKey($key, $hash)) {
                $entry = $entry.$next5;
            }
            if ($entry !== null) {
                $result = $entry.$value;
                $entry.$value = $value;
                return $result;
            }
            $this.$modCount2 = $this.$modCount2 + 1 | 0;
            var$8 = $this.$elementCount0 + 1 | 0;
            $this.$elementCount0 = var$8;
            if (var$8 > $this.$threshold0) {
                $this.$rehash();
                $index = var$4 % $this.$elementData0.data.length | 0;
            }
            if ($index < $this.$firstSlot)
                $this.$firstSlot = $index;
            if ($index > $this.$lastSlot)
                $this.$lastSlot = $index;
            var$9 = ju_Hashtable_newEntry($key, $value, $hash);
            var$9.$next5 = $this.$elementData0.data[$index];
            $this.$elementData0.data[$index] = var$9;
            return null;
        }
        $rt_throw(jl_NullPointerException__init_());
    } finally {
        jl_Object_monitorExitSync($this);
    }
},
ju_Hashtable_rehash = $this => {
    let $length, $newLast, $newData, $i, var$5, $entry, $index, var$8, $entry_0;
    $length = ($this.$elementData0.data.length << 1) + 1 | 0;
    if (!$length)
        $length = 1;
    $newLast = (-1);
    $newData = ju_Hashtable_newElementArray($this, $length);
    $i = $this.$lastSlot + 1 | 0;
    var$5 = $length;
    while (true) {
        $i = $i + (-1) | 0;
        if ($i < $this.$firstSlot)
            break;
        $entry = $this.$elementData0.data[$i];
        while ($entry !== null) {
            $index = ($entry.$getKeyHash() & 2147483647) % $length | 0;
            if ($index < var$5)
                var$5 = $index;
            if ($index > $newLast)
                $newLast = $index;
            var$8 = $newData.data;
            $entry_0 = $entry.$next5;
            $entry.$next5 = var$8[$index];
            var$8[$index] = $entry;
            $entry = $entry_0;
        }
    }
    $this.$firstSlot = var$5;
    $this.$lastSlot = $newLast;
    $this.$elementData0 = $newData;
    ju_Hashtable_computeMaxSize($this);
},
ju_Hashtable__clinit_ = () => {
    ju_Hashtable_EMPTY_ENUMERATION = ju_Hashtable$1__init_0();
    ju_Hashtable_EMPTY_ITERATOR = ju_Hashtable$2__init_0();
};
function ju_Properties() {
    ju_Hashtable.call(this);
    this.$defaults = null;
}
let ju_Properties__init_ = $this => {
    ju_Hashtable__init_($this);
},
ju_Properties__init_1 = () => {
    let var_0 = new ju_Properties();
    ju_Properties__init_(var_0);
    return var_0;
},
ju_Properties__init_0 = ($this, $properties) => {
    ju_Hashtable__init_($this);
    $this.$defaults = $properties;
},
ju_Properties__init_2 = var_0 => {
    let var_1 = new ju_Properties();
    ju_Properties__init_0(var_1, var_0);
    return var_1;
},
ju_Properties_getProperty = ($this, $name) => {
    let $result, $property;
    $result = ju_Hashtable_get($this, $name);
    $property = !($result instanceof jl_String) ? null : $result;
    if ($property === null && $this.$defaults !== null)
        $property = $this.$defaults.$getProperty($name);
    return $property;
},
jus_Collectors$toCollection$lambda$_1_1 = $rt_classWithoutFields(),
jus_Collectors$toCollection$lambda$_1_1__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jus_Collectors$toCollection$lambda$_1_1__init_0 = () => {
    let var_0 = new jus_Collectors$toCollection$lambda$_1_1();
    jus_Collectors$toCollection$lambda$_1_1__init_(var_0);
    return var_0;
},
oajqg_Identity = $rt_classWithoutFields(oajqg_Gate),
oajqg_Identity__init_ = ($this, $qubitIndex) => {
    oajqg_Gate__init_($this, 1, oajm_ComplexMatrix_createIdentityMatrix(2), $rt_s(17), $qubitIndex);
},
oajqg_Identity__init_0 = var_0 => {
    let var_1 = new oajqg_Identity();
    oajqg_Identity__init_(var_1, var_0);
    return var_1;
},
jus_Collectors$toCollection$lambda$_1_0 = $rt_classWithoutFields(),
jus_Collectors$toCollection$lambda$_1_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jus_Collectors$toCollection$lambda$_1_0__init_0 = () => {
    let var_0 = new jus_Collectors$toCollection$lambda$_1_0();
    jus_Collectors$toCollection$lambda$_1_0__init_(var_0);
    return var_0;
},
jus_Collectors$toCollection$lambda$_1_0_accept0 = (var$0, var$1, var$2) => {
    jus_Collectors$toCollection$lambda$_1_0_accept(var$0, var$1, var$2);
},
jus_Collectors$toCollection$lambda$_1_0_accept = (var$0, var$1, var$2) => {
    var$1.$add(var$2);
},
jl_NumberFormatException = $rt_classWithoutFields(jl_IllegalArgumentException),
jl_NumberFormatException__init_2 = $this => {
    jl_IllegalArgumentException__init_2($this);
},
jl_NumberFormatException__init_ = () => {
    let var_0 = new jl_NumberFormatException();
    jl_NumberFormatException__init_2(var_0);
    return var_0;
},
jl_NumberFormatException__init_0 = ($this, $message) => {
    jl_IllegalArgumentException__init_1($this, $message);
},
jl_NumberFormatException__init_1 = var_0 => {
    let var_1 = new jl_NumberFormatException();
    jl_NumberFormatException__init_0(var_1, var_0);
    return var_1;
};
function jusi_BoxedIntStream() {
    jusi_SimpleStreamImpl.call(this);
    this.$source = null;
}
let jusi_BoxedIntStream__init_ = ($this, $source) => {
    jusi_SimpleStreamImpl__init_($this);
    $this.$source = $source;
},
jusi_BoxedIntStream__init_0 = var_0 => {
    let var_1 = new jusi_BoxedIntStream();
    jusi_BoxedIntStream__init_(var_1, var_0);
    return var_1;
},
jusi_BoxedIntStream_next = ($this, $consumer) => {
    let var$2;
    var$2 = $this.$source;
    ju_Objects_requireNonNull0($consumer);
    return var$2.$next3(jusi_BoxedIntStream$next$lambda$_1_0__init_0($consumer));
},
oajw_JqapiBridge = $rt_classWithoutFields(),
oajw_JqapiBridge_$callClinit = () => {
    oajw_JqapiBridge_$callClinit = $rt_eraseClinit(oajw_JqapiBridge);
    oajw_JqapiBridge__clinit_();
},
oajw_JqapiBridge_main = $args => {
    oajw_JqapiBridge_$callClinit();
},
oajw_JqapiBridge_run = $specJson => {
    let $config, $spec, $circuit, $sim, $state, $sb, $i, $c, var$10, $$je;
    oajw_JqapiBridge_$callClinit();
    a: {
        b: {
            try {
                $config = oaj_JQAPIConfig_sequential(24);
                $spec = oajvs_CircuitSpecJson_fromJson($specJson, $config);
                $circuit = oajv_CircuitSpecs_toCircuit($spec, $config);
                $sim = oajqs_LocalSimulator__init_2($circuit);
                $sim.$execute0();
                $state = ($sim.$getQuantumRegister()).$getRegisterState();
                $sb = jl_StringBuilder__init_0($rt_s(175));
                $i = 0;
                while ($i < $state.$getDimension()) {
                    if ($i > 0)
                        $sb.$append0(44);
                    $c = $state.$getEntry($i);
                    var$10 = ($sb.$append1($rt_s(176))).$append10(oajm_Complex_getReal($c));
                    ((var$10.$append1($rt_s(177))).$append10(oajm_Complex_getImaginary($c))).$append0(125);
                    $i = $i + 1 | 0;
                }
                var$10 = ($sb.$append1($rt_s(178))).$toString();
            } catch ($$e) {
                $$je = $rt_wrapException($$e);
                if ($$je instanceof oaje_JQApiLimitException) {
                    break b;
                } else if ($$je instanceof jl_IllegalArgumentException) {
                    break a;
                } else if ($$je instanceof jl_RuntimeException) {
                    return oajw_JqapiBridge_error($rt_s(179));
                } else {
                    throw $$e;
                }
            }
            return var$10;
        }
        return oajw_JqapiBridge_error($rt_s(180));
    }
    return oajw_JqapiBridge_error($rt_s(181));
},
oajw_JqapiBridge_sample = ($specJson, $shots) => {
    let $config, $spec, $circuit, $counts, $sb, $i, var$9, var$10, $$je;
    oajw_JqapiBridge_$callClinit();
    if ($shots >= 1 && $shots <= 10000) {
        a: {
            b: {
                try {
                    $config = oaj_JQAPIConfig_sequential(24);
                    $spec = oajvs_CircuitSpecJson_fromJson($specJson, $config);
                    $circuit = oajv_CircuitSpecs_toCircuit($spec, $config);
                    $counts = oajqs_SamplingResult_counts(oajqs_CircuitSampler_sample($circuit, oajqs_SamplingOptions__init_1($shots)));
                    $sb = ((jl_StringBuilder__init_0($rt_s(182))).$append2($shots)).$append1($rt_s(183));
                    $i = 0;
                    while (true) {
                        var$9 = $counts.data;
                        if ($i >= var$9.length)
                            break;
                        if ($i > 0)
                            $sb.$append0(44);
                        $sb.$append2(var$9[$i]);
                        $i = $i + 1 | 0;
                    }
                    var$10 = ($sb.$append1($rt_s(178))).$toString();
                } catch ($$e) {
                    $$je = $rt_wrapException($$e);
                    if ($$je instanceof oaje_JQApiLimitException) {
                        break b;
                    } else if ($$je instanceof jl_IllegalArgumentException) {
                        break a;
                    } else if ($$je instanceof jl_RuntimeException) {
                        return oajw_JqapiBridge_error($rt_s(179));
                    } else {
                        throw $$e;
                    }
                }
                return var$10;
            }
            return oajw_JqapiBridge_error($rt_s(180));
        }
        return oajw_JqapiBridge_error($rt_s(181));
    }
    return oajw_JqapiBridge_error($rt_s(184));
},
oajw_JqapiBridge_error = $code => {
    oajw_JqapiBridge_$callClinit();
    return ((((jl_StringBuilder__init_()).$append1($rt_s(185))).$append1($code)).$append1($rt_s(186))).$toString();
},
oajw_JqapiBridge_run$exported$0 = var$1 => {
    oajw_JqapiBridge_$callClinit();
    return $rt_ustr(oajw_JqapiBridge_run($rt_str(var$1)));
},
oajw_JqapiBridge_sample$exported$1 = (var$1, var$2) => {
    oajw_JqapiBridge_$callClinit();
    return $rt_ustr(oajw_JqapiBridge_sample($rt_str(var$1), var$2));
},
oajw_JqapiBridge__clinit_ = () => {
    return;
},
ju_Deque = $rt_classWithoutFields(0);
function ju_ArrayDeque() {
    let a = this; ju_AbstractCollection.call(a);
    a.$version = 0;
    a.$array0 = null;
    a.$head0 = 0;
    a.$tail0 = 0;
}
let ju_ArrayDeque__init_0 = $this => {
    ju_ArrayDeque__init_($this, 8);
},
ju_ArrayDeque__init_1 = () => {
    let var_0 = new ju_ArrayDeque();
    ju_ArrayDeque__init_0(var_0);
    return var_0;
},
ju_ArrayDeque__init_ = ($this, $numElements) => {
    ju_AbstractCollection__init_($this);
    $this.$array0 = $rt_createArray(jl_Object, $numElements + 1 | 0);
},
ju_ArrayDeque__init_2 = var_0 => {
    let var_1 = new ju_ArrayDeque();
    ju_ArrayDeque__init_(var_1, var_0);
    return var_1;
},
ju_ArrayDeque_addLast = ($this, $e) => {
    ju_Objects_requireNonNull0($e);
    ju_ArrayDeque_ensureCapacity($this, $this.$size() + 1 | 0);
    $this.$array0.data[$this.$tail0] = $e;
    $this.$tail0 = ju_ArrayDeque_modInc($this.$tail0, $this.$array0.data.length);
    $this.$version = $this.$version + 1 | 0;
},
ju_ArrayDeque_removeFirst = $this => {
    let $value;
    $value = $this.$pollFirst();
    if ($value !== null)
        return $value;
    $rt_throw(ju_NoSuchElementException__init_());
},
ju_ArrayDeque_pollFirst = $this => {
    let $result;
    if ($this.$head0 == $this.$tail0)
        return null;
    $result = $this.$array0.data[$this.$head0];
    $this.$array0.data[$this.$head0] = null;
    $this.$head0 = ju_ArrayDeque_modInc($this.$head0, $this.$array0.data.length);
    $this.$version = $this.$version + 1 | 0;
    return $result;
},
ju_ArrayDeque_add = ($this, $e) => {
    $this.$addLast($e);
    return 1;
},
ju_ArrayDeque_remove = $this => {
    return $this.$removeFirst();
},
ju_ArrayDeque_size = $this => {
    return $this.$tail0 >= $this.$head0 ? $this.$tail0 - $this.$head0 | 0 : ($this.$array0.data.length - $this.$head0 | 0) + $this.$tail0 | 0;
},
ju_ArrayDeque_isEmpty = $this => {
    return $this.$head0 != $this.$tail0 ? 0 : 1;
},
ju_ArrayDeque_modInc = ($i, $mod) => {
    let var$3;
    var$3 = $i + 1 | 0;
    if (var$3 == $mod)
        var$3 = 0;
    return var$3;
},
ju_ArrayDeque_ensureCapacity = ($this, $capacity) => {
    let $newArraySize, $newArray, $j, $i, var$6, var$7, var$8;
    if ($capacity < $this.$array0.data.length)
        return;
    $newArraySize = jl_Math_max($this.$array0.data.length * 2 | 0, (($capacity * 3 | 0) / 2 | 0) + 1 | 0);
    if ($newArraySize < 1)
        $newArraySize = 2147483647;
    $newArray = $rt_createArray(jl_Object, $newArraySize);
    $j = 0;
    if ($this.$head0 <= $this.$tail0) {
        $i = $this.$head0;
        while ($i < $this.$tail0) {
            var$6 = $newArray.data;
            var$7 = $j + 1 | 0;
            var$6[$j] = $this.$array0.data[$i];
            $i = $i + 1 | 0;
            $j = var$7;
        }
    } else {
        $i = $this.$head0;
        while ($i < $this.$array0.data.length) {
            var$8 = $newArray.data;
            var$7 = $j + 1 | 0;
            var$8[$j] = $this.$array0.data[$i];
            $i = $i + 1 | 0;
            $j = var$7;
        }
        $i = 0;
        while ($i < $this.$tail0) {
            var$6 = $newArray.data;
            var$7 = $j + 1 | 0;
            var$6[$j] = $this.$array0.data[$i];
            $i = $i + 1 | 0;
            $j = var$7;
        }
    }
    $this.$head0 = 0;
    $this.$tail0 = $j;
    $this.$array0 = $newArray;
};
function jusi_SimpleStreamIterator() {
    let a = this; jl_Object.call(a);
    a.$stream0 = null;
    a.$lastElement = null;
    a.$state = 0;
}
let jusi_SimpleStreamIterator__init_ = ($this, $stream) => {
    jl_Object__init_($this);
    $this.$stream0 = $stream;
},
jusi_SimpleStreamIterator__init_0 = var_0 => {
    let var_1 = new jusi_SimpleStreamIterator();
    jusi_SimpleStreamIterator__init_(var_1, var_0);
    return var_1;
},
jusi_SimpleStreamIterator_hasNext = $this => {
    jusi_SimpleStreamIterator_fetchIfNeeded($this);
    return $this.$state == 3 ? 0 : 1;
},
jusi_SimpleStreamIterator_next = $this => {
    let $result;
    jusi_SimpleStreamIterator_fetchIfNeeded($this);
    if ($this.$state == 3)
        $rt_throw(ju_NoSuchElementException__init_());
    $result = $this.$lastElement;
    $this.$lastElement = null;
    $this.$state = $this.$state != 2 ? 0 : 3;
    return $result;
},
jusi_SimpleStreamIterator_fetchIfNeeded = $this => {
    let $hasMore;
    if ($this.$state)
        return;
    $this.$state = 0;
    while (!$this.$state) {
        $hasMore = $this.$stream0.$next0(jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0__init_0($this));
        if (!$hasMore) {
            if ($this.$state)
                $this.$state = 2;
            else
                $this.$state = 3;
            $this.$stream0 = null;
        }
    }
},
jusi_SimpleStreamIterator_lambda$fetchIfNeeded$1 = ($this, $e) => {
    $this.$lastElement = $e;
    $this.$state = 1;
    return 0;
};
function oajq_QuantumRegister$_init_$lambda$_3_0() {
    jl_Object.call(this);
    this.$_014 = null;
}
let oajq_QuantumRegister$_init_$lambda$_3_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_014 = var$1;
},
oajq_QuantumRegister$_init_$lambda$_3_0__init_0 = var_0 => {
    let var_1 = new oajq_QuantumRegister$_init_$lambda$_3_0();
    oajq_QuantumRegister$_init_$lambda$_3_0__init_(var_1, var_0);
    return var_1;
},
oajq_QuantumRegister$_init_$lambda$_3_0_getAsDouble = var$0 => {
    return var$0.$_014.$nextDouble();
};
function jusi_AllMatchConsumer() {
    let a = this; jl_Object.call(a);
    a.$matched = 0;
    a.$predicate = null;
}
let jusi_AllMatchConsumer__init_ = ($this, $predicate) => {
    jl_Object__init_($this);
    $this.$matched = 1;
    $this.$predicate = $predicate;
},
jusi_AllMatchConsumer__init_0 = var_0 => {
    let var_1 = new jusi_AllMatchConsumer();
    jusi_AllMatchConsumer__init_(var_1, var_0);
    return var_1;
},
jusi_AllMatchConsumer_test = ($this, $t) => {
    if (!$this.$predicate.$test1($t))
        $this.$matched = 0;
    return $this.$matched;
},
jl_IllegalStateException = $rt_classWithoutFields(jl_RuntimeException),
jl_IllegalStateException__init_ = ($this, $message) => {
    jl_RuntimeException__init_0($this, $message);
},
jl_IllegalStateException__init_0 = var_0 => {
    let var_1 = new jl_IllegalStateException();
    jl_IllegalStateException__init_(var_1, var_0);
    return var_1;
},
oajqg_ControlledNot = $rt_classWithoutFields(oajqg_Gate),
oajqg_ControlledNot__init_ = ($this, $controlQubit, $targetQubit) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 2, oaju_Constants_CONTROLLED_NOT_MATRIX, $rt_s(20), $rt_wrapArray(jl_Integer, [$controlQubit, $targetQubit]));
},
oajqg_ControlledNot__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_ControlledNot();
    oajqg_ControlledNot__init_(var_2, var_0, var_1);
    return var_2;
},
juf_IntConsumer = $rt_classWithoutFields(0);
function oajvs_CircuitSpecJson$JsonParser() {
    let a = this; jl_Object.call(a);
    a.$s = null;
    a.$pos = 0;
    a.$depth = 0;
}
let oajvs_CircuitSpecJson$JsonParser__init_ = ($this, $s) => {
    jl_Object__init_($this);
    $this.$s = $s;
},
oajvs_CircuitSpecJson$JsonParser__init_0 = var_0 => {
    let var_1 = new oajvs_CircuitSpecJson$JsonParser();
    oajvs_CircuitSpecJson$JsonParser__init_(var_1, var_0);
    return var_1;
},
oajvs_CircuitSpecJson$JsonParser_parse = $this => {
    let $v;
    $v = oajvs_CircuitSpecJson$JsonParser_parseValue($this);
    oajvs_CircuitSpecJson$JsonParser_skipWs($this);
    if ($this.$pos == jl_String_length($this.$s))
        return $v;
    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(187)));
},
oajvs_CircuitSpecJson$JsonParser_parseValue = $this => {
    let $c, var$2;
    oajvs_CircuitSpecJson$JsonParser_skipWs($this);
    if ($this.$pos >= jl_String_length($this.$s))
        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(188)));
    a: {
        $c = jl_String_charAt($this.$s, $this.$pos);
        switch ($c) {
            case 34:
                break;
            case 91:
                var$2 = oajvs_CircuitSpecJson$JsonParser_parseArray($this);
                break a;
            case 102:
            case 116:
                var$2 = oajvs_CircuitSpecJson$JsonParser_parseBool($this);
                break a;
            case 110:
                var$2 = oajvs_CircuitSpecJson$JsonParser_parseNull($this);
                break a;
            case 123:
                var$2 = oajvs_CircuitSpecJson$JsonParser_parseObject($this);
                break a;
            default:
                var$2 = oajvs_CircuitSpecJson$JsonParser_parseNumber($this);
                break a;
        }
        var$2 = oajvs_CircuitSpecJson$JsonParser_parseString($this);
    }
    return var$2;
},
oajvs_CircuitSpecJson$JsonParser_parseObject = $this => {
    let var$1, $m, var$3, $key, $c, $$je;
    var$1 = $this.$depth + 1 | 0;
    $this.$depth = var$1;
    if (var$1 > 200)
        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(189)));
    a: {
        b: {
            c: {
                try {
                    $m = ju_LinkedHashMap__init_();
                    $this.$pos = $this.$pos + 1 | 0;
                    oajvs_CircuitSpecJson$JsonParser_skipWs($this);
                    if (oajvs_CircuitSpecJson$JsonParser_peek($this) != 125)
                        break c;
                    $this.$pos = $this.$pos + 1 | 0;
                } catch ($$e) {
                    $$je = $rt_wrapException($$e);
                    var$3 = $$je;
                    break b;

                }
                $this.$depth = $this.$depth - 1 | 0;
                return $m;
            }
            d: {
                try {
                    while (true) {
                        oajvs_CircuitSpecJson$JsonParser_skipWs($this);
                        $key = oajvs_CircuitSpecJson$JsonParser_parseString($this);
                        oajvs_CircuitSpecJson$JsonParser_skipWs($this);
                        oajvs_CircuitSpecJson$JsonParser_expect($this, 58);
                        $m.$put($key, oajvs_CircuitSpecJson$JsonParser_parseValue($this));
                        oajvs_CircuitSpecJson$JsonParser_skipWs($this);
                        $c = oajvs_CircuitSpecJson$JsonParser_nextChar($this);
                        if ($c == 125)
                            break d;
                        if ($c != 44)
                            break;
                    }
                    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(190)));
                } catch ($$e) {
                    $$je = $rt_wrapException($$e);
                    var$3 = $$je;
                    break b;

                }
            }
            try {
                break a;
            } catch ($$e) {
                $$je = $rt_wrapException($$e);
                var$3 = $$je;
                break b;

            }
        }
        $this.$depth = $this.$depth - 1 | 0;
        $rt_throw(var$3);
    }
    $this.$depth = $this.$depth - 1 | 0;
    return $m;
},
oajvs_CircuitSpecJson$JsonParser_parseArray = $this => {
    let var$1, $a, var$3, $c, $$je;
    var$1 = $this.$depth + 1 | 0;
    $this.$depth = var$1;
    if (var$1 > 200)
        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(189)));
    a: {
        b: {
            c: {
                try {
                    $a = ju_ArrayList__init_();
                    $this.$pos = $this.$pos + 1 | 0;
                    oajvs_CircuitSpecJson$JsonParser_skipWs($this);
                    if (oajvs_CircuitSpecJson$JsonParser_peek($this) != 93)
                        break c;
                    $this.$pos = $this.$pos + 1 | 0;
                } catch ($$e) {
                    $$je = $rt_wrapException($$e);
                    var$3 = $$je;
                    break b;

                }
                $this.$depth = $this.$depth - 1 | 0;
                return $a;
            }
            d: {
                try {
                    while (true) {
                        $a.$add(oajvs_CircuitSpecJson$JsonParser_parseValue($this));
                        oajvs_CircuitSpecJson$JsonParser_skipWs($this);
                        $c = oajvs_CircuitSpecJson$JsonParser_nextChar($this);
                        if ($c == 93)
                            break d;
                        if ($c != 44)
                            break;
                    }
                    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(191)));
                } catch ($$e) {
                    $$je = $rt_wrapException($$e);
                    var$3 = $$je;
                    break b;

                }
            }
            try {
                break a;
            } catch ($$e) {
                $$je = $rt_wrapException($$e);
                var$3 = $$je;
                break b;

            }
        }
        $this.$depth = $this.$depth - 1 | 0;
        $rt_throw(var$3);
    }
    $this.$depth = $this.$depth - 1 | 0;
    return $a;
},
oajvs_CircuitSpecJson$JsonParser_parseString = $this => {
    let $sb, var$2, var$3, $c, var$5, var$6, $e;
    oajvs_CircuitSpecJson$JsonParser_expect($this, 34);
    $sb = jl_StringBuilder__init_();
    a: {
        while (true) {
            if ($this.$pos >= jl_String_length($this.$s))
                $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(192)));
            var$2 = $this.$s;
            var$3 = $this.$pos;
            $this.$pos = var$3 + 1 | 0;
            $c = jl_String_charAt(var$2, var$3);
            if ($c == 34)
                break;
            if ($c != 92) {
                if ($c < 32)
                    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(193)));
                if (!jl_Character_isHighSurrogate($c)) {
                    if (jl_Character_isLowSurrogate($c))
                        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(194)));
                    $sb.$append0($c);
                } else {
                    if ($this.$pos >= jl_String_length($this.$s))
                        break a;
                    if (!jl_Character_isLowSurrogate(jl_String_charAt($this.$s, $this.$pos)))
                        break a;
                    var$2 = $sb.$append0($c);
                    var$5 = $this.$s;
                    var$3 = $this.$pos;
                    $this.$pos = var$3 + 1 | 0;
                    var$2.$append0(jl_String_charAt(var$5, var$3));
                }
            } else {
                if ($this.$pos >= jl_String_length($this.$s))
                    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(195)));
                b: {
                    var$2 = $this.$s;
                    var$6 = $this.$pos;
                    $this.$pos = var$6 + 1 | 0;
                    $e = jl_String_charAt(var$2, var$6);
                    switch ($e) {
                        case 34:
                            $sb.$append0(34);
                            break b;
                        case 47:
                            $sb.$append0(47);
                            break b;
                        case 92:
                            $sb.$append0(92);
                            break b;
                        case 98:
                            $sb.$append0(8);
                            break b;
                        case 102:
                            $sb.$append0(12);
                            break b;
                        case 110:
                            $sb.$append0(10);
                            break b;
                        case 114:
                            $sb.$append0(13);
                            break b;
                        case 116:
                            $sb.$append0(9);
                            break b;
                        case 117:
                            break;
                        default:
                            $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, ((((jl_StringBuilder__init_()).$append1($rt_s(196))).$append0($e)).$append1($rt_s(197))).$toString()));
                    }
                    oajvs_CircuitSpecJson$JsonParser_appendUnicodeEscape($this, $sb);
                }
            }
        }
        return $sb.$toString();
    }
    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(198)));
},
oajvs_CircuitSpecJson$JsonParser_appendUnicodeEscape = ($this, $sb) => {
    let $ch, $low;
    a: {
        $ch = oajvs_CircuitSpecJson$JsonParser_readHexCodeUnit($this) & 65535;
        if (!jl_Character_isHighSurrogate($ch)) {
            if (!jl_Character_isLowSurrogate($ch)) {
                $sb.$append0($ch);
                break a;
            }
            $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(199)));
        }
        if (($this.$pos + 2 | 0) <= jl_String_length($this.$s) && jl_String_charAt($this.$s, $this.$pos) == 92 && jl_String_charAt($this.$s, $this.$pos + 1 | 0) == 117) {
            $this.$pos = $this.$pos + 2 | 0;
            $low = oajvs_CircuitSpecJson$JsonParser_readHexCodeUnit($this) & 65535;
            if (!jl_Character_isLowSurrogate($low))
                $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(200)));
            ($sb.$append0($ch)).$append0($low);
        } else
            $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(201)));
    }
},
oajvs_CircuitSpecJson$JsonParser_readHexCodeUnit = $this => {
    let $value, $i, $digit;
    if (($this.$pos + 4 | 0) > jl_String_length($this.$s))
        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(202)));
    $value = 0;
    $i = 0;
    while (true) {
        if ($i >= 4) {
            $this.$pos = $this.$pos + 4 | 0;
            return $value;
        }
        $digit = oajvs_CircuitSpecJson$JsonParser_asciiHexDigit(jl_String_charAt($this.$s, $this.$pos + $i | 0));
        if ($digit < 0)
            break;
        $value = $value << 4 | $digit;
        $i = $i + 1 | 0;
    }
    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(203)));
},
oajvs_CircuitSpecJson$JsonParser_asciiHexDigit = $c => {
    if ($c >= 48 && $c <= 57)
        return $c - 48 | 0;
    if ($c >= 97 && $c <= 102)
        return ($c - 97 | 0) + 10 | 0;
    if ($c >= 65 && $c <= 70)
        return ($c - 65 | 0) + 10 | 0;
    return (-1);
},
oajvs_CircuitSpecJson$JsonParser_parseNumber = $this => {
    let $start, var$2, $$je;
    $start = $this.$pos;
    oajvs_CircuitSpecJson$JsonParser_consume($this, 45);
    if (!oajvs_CircuitSpecJson$JsonParser_consume($this, 48))
        oajvs_CircuitSpecJson$JsonParser_requireDigits($this);
    if (oajvs_CircuitSpecJson$JsonParser_consume($this, 46))
        oajvs_CircuitSpecJson$JsonParser_requireDigits($this);
    if (!(!oajvs_CircuitSpecJson$JsonParser_consume($this, 101) && !oajvs_CircuitSpecJson$JsonParser_consume($this, 69))) {
        if (!oajvs_CircuitSpecJson$JsonParser_consume($this, 43))
            oajvs_CircuitSpecJson$JsonParser_consume($this, 45);
        oajvs_CircuitSpecJson$JsonParser_requireDigits($this);
    }
    a: {
        try {
            var$2 = jl_Double_valueOf(jl_Double_parseDouble(jl_String_substring($this.$s, $start, $this.$pos)));
        } catch ($$e) {
            $$je = $rt_wrapException($$e);
            if ($$je instanceof jl_NumberFormatException) {
                break a;
            } else {
                throw $$e;
            }
        }
        return var$2;
    }
    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(204)));
},
oajvs_CircuitSpecJson$JsonParser_consume = ($this, $c) => {
    if ($this.$pos < jl_String_length($this.$s) && jl_String_charAt($this.$s, $this.$pos) == $c) {
        $this.$pos = $this.$pos + 1 | 0;
        return 1;
    }
    return 0;
},
oajvs_CircuitSpecJson$JsonParser_requireDigits = $this => {
    let $start;
    $start = $this.$pos;
    while ($this.$pos < jl_String_length($this.$s) && jl_String_charAt($this.$s, $this.$pos) >= 48 && jl_String_charAt($this.$s, $this.$pos) <= 57) {
        $this.$pos = $this.$pos + 1 | 0;
    }
    if ($this.$pos != $start)
        return;
    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(205)));
},
oajvs_CircuitSpecJson$JsonParser_parseBool = $this => {
    if (jl_String_startsWith($this.$s, $rt_s(126), $this.$pos)) {
        $this.$pos = $this.$pos + 4 | 0;
        jl_Boolean_$callClinit();
        return jl_Boolean_TRUE;
    }
    if (!jl_String_startsWith($this.$s, $rt_s(127), $this.$pos))
        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(206)));
    $this.$pos = $this.$pos + 5 | 0;
    jl_Boolean_$callClinit();
    return jl_Boolean_FALSE;
},
oajvs_CircuitSpecJson$JsonParser_parseNull = $this => {
    if (!jl_String_startsWith($this.$s, $rt_s(59), $this.$pos))
        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(206)));
    $this.$pos = $this.$pos + 4 | 0;
    return null;
},
oajvs_CircuitSpecJson$JsonParser_skipWs = $this => {
    while ($this.$pos < jl_String_length($this.$s) && jl_String_indexOf0($rt_s(207), jl_String_charAt($this.$s, $this.$pos)) >= 0) {
        $this.$pos = $this.$pos + 1 | 0;
    }
},
oajvs_CircuitSpecJson$JsonParser_peek = $this => {
    oajvs_CircuitSpecJson$JsonParser_skipWs($this);
    return $this.$pos >= jl_String_length($this.$s) ? 0 : jl_String_charAt($this.$s, $this.$pos);
},
oajvs_CircuitSpecJson$JsonParser_nextChar = $this => {
    let var$1, var$2;
    if ($this.$pos >= jl_String_length($this.$s))
        $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, $rt_s(188)));
    var$1 = $this.$s;
    var$2 = $this.$pos;
    $this.$pos = var$2 + 1 | 0;
    return jl_String_charAt(var$1, var$2);
},
oajvs_CircuitSpecJson$JsonParser_expect = ($this, $c) => {
    oajvs_CircuitSpecJson$JsonParser_skipWs($this);
    if ($this.$pos < jl_String_length($this.$s) && jl_String_charAt($this.$s, $this.$pos) == $c) {
        $this.$pos = $this.$pos + 1 | 0;
        return;
    }
    $rt_throw(oajvs_CircuitSpecJson$JsonParser_err($this, ((((jl_StringBuilder__init_()).$append1($rt_s(208))).$append0($c)).$append1($rt_s(197))).$toString()));
},
oajvs_CircuitSpecJson$JsonParser_err = ($this, $msg) => {
    return jl_IllegalArgumentException__init_((((((jl_StringBuilder__init_()).$append1($rt_s(209))).$append2($this.$pos)).$append1($rt_s(37))).$append1($msg)).$toString());
},
jl_NullPointerException = $rt_classWithoutFields(jl_RuntimeException),
jl_NullPointerException__init_2 = ($this, $message) => {
    jl_RuntimeException__init_0($this, $message);
},
jl_NullPointerException__init_1 = var_0 => {
    let var_1 = new jl_NullPointerException();
    jl_NullPointerException__init_2(var_1, var_0);
    return var_1;
},
jl_NullPointerException__init_0 = $this => {
    jl_RuntimeException__init_($this);
},
jl_NullPointerException__init_ = () => {
    let var_0 = new jl_NullPointerException();
    jl_NullPointerException__init_0(var_0);
    return var_0;
},
jus_Collector$of$lambda$_5_0 = $rt_classWithoutFields(),
jus_Collector$of$lambda$_5_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
jus_Collector$of$lambda$_5_0__init_0 = () => {
    let var_0 = new jus_Collector$of$lambda$_5_0();
    jus_Collector$of$lambda$_5_0__init_(var_0);
    return var_0;
},
jus_Collector$of$lambda$_5_0_apply = (var$0, var$1) => {
    return jus_Collector_lambda$of$0(var$1);
};
function otpp_AsyncCallbackWrapper() {
    jl_Object.call(this);
    this.$realAsyncCallback = null;
}
let otpp_AsyncCallbackWrapper__init_ = ($this, $realAsyncCallback) => {
    jl_Object__init_($this);
    $this.$realAsyncCallback = $realAsyncCallback;
},
otpp_AsyncCallbackWrapper__init_0 = var_0 => {
    let var_1 = new otpp_AsyncCallbackWrapper();
    otpp_AsyncCallbackWrapper__init_(var_1, var_0);
    return var_1;
},
otpp_AsyncCallbackWrapper_create = $realAsyncCallback => {
    return otpp_AsyncCallbackWrapper__init_0($realAsyncCallback);
},
otpp_AsyncCallbackWrapper_complete = ($this, $result) => {
    $this.$realAsyncCallback.$complete($result);
},
otpp_AsyncCallbackWrapper_error = ($this, $e) => {
    $this.$realAsyncCallback.$error0($e);
};
function jl_Object$Monitor() {
    let a = this; jl_Object.call(a);
    a.$enteringThreads = null;
    a.$notifyListeners = null;
    a.$owner = null;
    a.$count0 = 0;
}
let jl_Object$Monitor__init_ = $this => {
    jl_Object__init_($this);
    $this.$owner = jl_Thread_currentThread();
},
jl_Object$Monitor__init_0 = () => {
    let var_0 = new jl_Object$Monitor();
    jl_Object$Monitor__init_(var_0);
    return var_0;
};
function ju_LinkedHashMapEntrySet() {
    let a = this; ju_AbstractSet.call(a);
    a.$base = null;
    a.$reversed = 0;
}
let ju_LinkedHashMapEntrySet__init_ = ($this, $base, $reversed) => {
    ju_AbstractSet__init_($this);
    $this.$base = $base;
    $this.$reversed = $reversed;
},
ju_LinkedHashMapEntrySet__init_0 = (var_0, var_1) => {
    let var_2 = new ju_LinkedHashMapEntrySet();
    ju_LinkedHashMapEntrySet__init_(var_2, var_0, var_1);
    return var_2;
},
ju_LinkedHashMapEntrySet_size = $this => {
    return $this.$base.$elementCount;
},
ju_LinkedHashMapEntrySet_iterator = $this => {
    return ju_LinkedHashMapIterator$EntryIterator__init_0($this.$base, $this.$reversed);
},
jl_Math = $rt_classWithoutFields(),
jl_Math_sin = var$1 => {
    return Math.sin(var$1);
},
jl_Math_cos = var$1 => {
    return Math.cos(var$1);
},
jl_Math_log = var$1 => {
    return Math.log(var$1);
},
jl_Math_sqrt = var$1 => {
    return Math.sqrt(var$1);
},
jl_Math_pow = (var$1, $y) => {
    return jl_Math_powImpl(var$1, $y);
},
jl_Math_powImpl = (var$1, var$2) => {
    return Math.pow(var$1, var$2);
},
jl_Math_rint = var$1 => {
    return Long_toNumber(jl_Math_round(var$1));
},
jl_Math_round = $a => {
    return Long_fromNumber($a + jl_Math_signum($a) * 0.5);
},
jl_Math_random = () => {
    return jl_Math_randomImpl();
},
jl_Math_randomImpl = () => {
    return Math.random();
},
jl_Math_min = ($a, $b) => {
    if ($a < $b)
        $b = $a;
    return $b;
},
jl_Math_max = ($a, $b) => {
    if ($a > $b)
        $b = $a;
    return $b;
},
jl_Math_abs = $n => {
    if ($n < 0)
        $n =  -$n | 0;
    return $n;
},
jl_Math_abs0 = $n => {
    if (Long_lt($n, Long_ZERO))
        $n = Long_neg($n);
    return $n;
},
jl_Math_absImpl = var$1 => {
    return Math.abs(var$1);
},
jl_Math_abs1 = var$1 => {
    return jl_Math_absImpl(var$1);
},
jl_Math_sign = var$1 => {
    return Math.sign(var$1);
},
jl_Math_signum = var$1 => {
    return jl_Math_sign(var$1);
};
function jm_RoundingMode() {
    jl_Enum.call(this);
    this.$bigDecimalRM = 0;
}
let jm_RoundingMode_UP = null,
jm_RoundingMode_DOWN = null,
jm_RoundingMode_CEILING = null,
jm_RoundingMode_FLOOR = null,
jm_RoundingMode_HALF_UP = null,
jm_RoundingMode_HALF_DOWN = null,
jm_RoundingMode_HALF_EVEN = null,
jm_RoundingMode_UNNECESSARY = null,
jm_RoundingMode_$VALUES = null,
jm_RoundingMode_$callClinit = () => {
    jm_RoundingMode_$callClinit = $rt_eraseClinit(jm_RoundingMode);
    jm_RoundingMode__clinit_();
},
jm_RoundingMode_values = () => {
    jm_RoundingMode_$callClinit();
    return jm_RoundingMode_$VALUES.$clone0();
},
jm_RoundingMode__init_0 = ($this, var$1, var$2, $rm) => {
    jm_RoundingMode_$callClinit();
    jl_Enum__init_($this, var$1, var$2);
    $this.$bigDecimalRM = $rm;
},
jm_RoundingMode__init_ = (var_0, var_1, var_2) => {
    let var_3 = new jm_RoundingMode();
    jm_RoundingMode__init_0(var_3, var_0, var_1, var_2);
    return var_3;
},
jm_RoundingMode_$values = () => {
    let var$1, var$2;
    jm_RoundingMode_$callClinit();
    var$1 = $rt_createArray(jm_RoundingMode, 8);
    var$2 = var$1.data;
    var$2[0] = jm_RoundingMode_UP;
    var$2[1] = jm_RoundingMode_DOWN;
    var$2[2] = jm_RoundingMode_CEILING;
    var$2[3] = jm_RoundingMode_FLOOR;
    var$2[4] = jm_RoundingMode_HALF_UP;
    var$2[5] = jm_RoundingMode_HALF_DOWN;
    var$2[6] = jm_RoundingMode_HALF_EVEN;
    var$2[7] = jm_RoundingMode_UNNECESSARY;
    return var$1;
},
jm_RoundingMode__clinit_ = () => {
    jm_RoundingMode_UP = jm_RoundingMode__init_($rt_s(210), 0, 0);
    jm_RoundingMode_DOWN = jm_RoundingMode__init_($rt_s(211), 1, 1);
    jm_RoundingMode_CEILING = jm_RoundingMode__init_($rt_s(212), 2, 2);
    jm_RoundingMode_FLOOR = jm_RoundingMode__init_($rt_s(213), 3, 3);
    jm_RoundingMode_HALF_UP = jm_RoundingMode__init_($rt_s(214), 4, 4);
    jm_RoundingMode_HALF_DOWN = jm_RoundingMode__init_($rt_s(215), 5, 5);
    jm_RoundingMode_HALF_EVEN = jm_RoundingMode__init_($rt_s(216), 6, 6);
    jm_RoundingMode_UNNECESSARY = jm_RoundingMode__init_($rt_s(217), 7, 7);
    jm_RoundingMode_$VALUES = jm_RoundingMode_$values();
};
function oajq_Circuit() {
    let a = this; jl_Object.call(a);
    a.$levels0 = null;
    a.$config0 = null;
    a.$inputSize = 0;
}
let oajq_Circuit__init_ = ($this, $inputSize, $config) => {
    jl_Object__init_($this);
    $this.$config0 = $config;
    oajq_Circuit_validateInputSize($this, $inputSize);
    $this.$inputSize = $inputSize;
    $this.$levels0 = ju_ArrayList__init_();
},
oajq_Circuit__init_0 = (var_0, var_1) => {
    let var_2 = new oajq_Circuit();
    oajq_Circuit__init_(var_2, var_0, var_1);
    return var_2;
},
oajq_Circuit_getInputSize = $this => {
    return $this.$inputSize;
},
oajq_Circuit_getConfig = $this => {
    return $this.$config0;
},
oajq_Circuit_validateInputSize = ($this, $inputSize) => {
    if ($inputSize <= 0)
        $rt_throw(oaje_JQApiLimitException__init_((((jl_StringBuilder__init_()).$append1($rt_s(218))).$append2($inputSize)).$toString()));
    if ($inputSize <= oaj_JQAPIConfig_maxQubits($this.$config0))
        return;
    $rt_throw(oaje_JQApiLimitException__init_(((((((jl_StringBuilder__init_()).$append1($rt_s(219))).$append2($inputSize)).$append1($rt_s(220))).$append2(oaj_JQAPIConfig_maxQubits($this.$config0))).$append1($rt_s(132))).$toString()));
},
oajq_Circuit_getLevels = $this => {
    return $this.$levels0;
},
oajq_Circuit_addLevel = ($this, $levels) => {
    let var$2, var$3, var$4, $level;
    var$2 = $levels.data;
    var$3 = var$2.length;
    var$4 = 0;
    while (var$4 < var$3) {
        $level = var$2[var$4];
        $this.$levels0.$add(oajq_Circuit_initializeLevels($this, $level));
        var$4 = var$4 + 1 | 0;
    }
},
oajq_Circuit_initializeLevels = ($this, $level) => {
    let $errorGate, $indexes;
    $errorGate = (($level.$getGates()).$stream()).$anyMatch(oajq_Circuit$initializeLevels$lambda$_8_0__init_0($this));
    if ($errorGate)
        $rt_throw(jl_IllegalArgumentException__init_($rt_s(221)));
    $indexes = (((jus_IntStream_range(0, $this.$inputSize)).$filter(oajq_Circuit$initializeLevels$lambda$_8_1__init_0($level))).$boxed()).$collect(jus_Collectors_toList());
    $indexes.$forEach(oajq_Circuit$initializeLevels$lambda$_8_2__init_0($level));
    return $level;
},
oajq_Circuit_lambda$initializeLevels$4 = ($level, $index) => {
    let var$3, var$4;
    var$3 = new oajqg_Identity;
    var$4 = $rt_createArray(jl_Integer, 1);
    var$4.data[0] = $index;
    oajqg_Identity__init_(var$3, var$4);
    $level.$addGate0($index, var$3);
},
oajq_Circuit_lambda$initializeLevels$2 = ($level, $index) => {
    return (($level.$getGates()).$stream()).$allMatch(oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0__init_0($index));
},
oajq_Circuit_lambda$initializeLevels$3 = ($index, $gate) => {
    return ($gate.$getIndexes()).$contains(jl_Integer_valueOf($index)) ? 0 : 1;
},
oajq_Circuit_lambda$initializeLevels$0 = ($this, $g) => {
    return ($g.$getIndexes()).$size() <= $this.$inputSize && (($g.$getIndexes()).$stream()).$allMatch(oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0__init_0($this)) ? 0 : 1;
},
oajq_Circuit_lambda$initializeLevels$1 = ($this, $index) => {
    return $index.$intValue() >= 0 && $index.$intValue() < $this.$inputSize ? 1 : 0;
};
function oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0() {
    let a = this; jl_Object.call(a);
    a.$_04 = null;
    a.$_10 = null;
}
let oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0__init_ = (var$0, var$1, var$2) => {
    jl_Object__init_(var$0);
    var$0.$_04 = var$1;
    var$0.$_10 = var$2;
},
oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0__init_0 = (var_0, var_1) => {
    let var_2 = new oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0();
    oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0__init_(var_2, var_0, var_1);
    return var_2;
},
oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0_accept0 = (var$0, var$1) => {
    oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0_accept(var$0, var$1);
},
oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0_accept = (var$0, var$1) => {
    oajqs_LocalSimulator_lambda$execute$2(var$0.$_04, var$0.$_10, var$1);
};
function ju_TemplateCollections$SingleElementList() {
    ju_TemplateCollections$AbstractImmutableList.call(this);
    this.$value4 = null;
}
let ju_TemplateCollections$SingleElementList__init_ = ($this, $value) => {
    ju_TemplateCollections$AbstractImmutableList__init_($this);
    $this.$value4 = $value;
},
ju_TemplateCollections$SingleElementList__init_0 = var_0 => {
    let var_1 = new ju_TemplateCollections$SingleElementList();
    ju_TemplateCollections$SingleElementList__init_(var_1, var_0);
    return var_1;
},
ju_TemplateCollections$SingleElementList_size = $this => {
    return 1;
},
ju_TemplateCollections$SingleElementList_get = ($this, $index) => {
    if (!$index)
        return $this.$value4;
    $rt_throw(jl_IndexOutOfBoundsException__init_());
};
function oajq_QuantumRegister$applyOperator$lambda$_18_0() {
    let a = this; jl_Object.call(a);
    a.$_017 = null;
    a.$_15 = 0;
    a.$_20 = null;
    a.$_30 = null;
    a.$_4 = null;
    a.$_5 = null;
}
let oajq_QuantumRegister$applyOperator$lambda$_18_0__init_ = (var$0, var$1, var$2, var$3, var$4, var$5, var$6) => {
    jl_Object__init_(var$0);
    var$0.$_017 = var$1;
    var$0.$_15 = var$2;
    var$0.$_20 = var$3;
    var$0.$_30 = var$4;
    var$0.$_4 = var$5;
    var$0.$_5 = var$6;
},
oajq_QuantumRegister$applyOperator$lambda$_18_0__init_0 = (var_0, var_1, var_2, var_3, var_4, var_5) => {
    let var_6 = new oajq_QuantumRegister$applyOperator$lambda$_18_0();
    oajq_QuantumRegister$applyOperator$lambda$_18_0__init_(var_6, var_0, var_1, var_2, var_3, var_4, var_5);
    return var_6;
},
oajq_QuantumRegister$applyOperator$lambda$_18_0_accept = (var$0, var$1) => {
    oajq_QuantumRegister_lambda$applyOperator$0(var$0.$_017, var$0.$_15, var$0.$_20, var$0.$_30, var$0.$_4, var$0.$_5, var$1);
};
function jusi_FilteringIntStreamImpl() {
    jusi_WrappingIntStreamImpl.call(this);
    this.$filter0 = null;
}
let jusi_FilteringIntStreamImpl__init_ = ($this, $innerStream, $filter) => {
    jusi_WrappingIntStreamImpl__init_($this, $innerStream);
    $this.$filter0 = $filter;
},
jusi_FilteringIntStreamImpl__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_FilteringIntStreamImpl();
    jusi_FilteringIntStreamImpl__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_FilteringIntStreamImpl_wrap = ($this, $consumer) => {
    return jusi_FilteringIntStreamImpl$wrap$lambda$_1_0__init_0($this, $consumer);
},
jusi_FilteringIntStreamImpl_lambda$wrap$0 = ($this, $consumer, $t) => {
    if ($this.$filter0.$test2($t))
        return $consumer.$test2($t);
    return 1;
};
function jusi_MappingStreamImpl() {
    jusi_WrappingStreamImpl.call(this);
    this.$mapper = null;
}
let jusi_MappingStreamImpl__init_ = ($this, $sourceStream, $mapper) => {
    jusi_WrappingStreamImpl__init_($this, $sourceStream);
    $this.$mapper = $mapper;
},
jusi_MappingStreamImpl__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_MappingStreamImpl();
    jusi_MappingStreamImpl__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_MappingStreamImpl_wrap = ($this, $consumer) => {
    return jusi_MappingStreamImpl$wrap$lambda$_1_0__init_0($this, $consumer);
},
jusi_MappingStreamImpl_lambda$wrap$0 = ($this, $consumer, $t) => {
    return $consumer.$test1($this.$mapper.$apply0($t));
};
function ju_TemplateCollections$ImmutableArrayList() {
    ju_TemplateCollections$AbstractImmutableList.call(this);
    this.$list = null;
}
let ju_TemplateCollections$ImmutableArrayList__init_ = ($this, $list) => {
    ju_TemplateCollections$AbstractImmutableList__init_($this);
    $this.$list = $list;
},
ju_TemplateCollections$ImmutableArrayList__init_1 = var_0 => {
    let var_1 = new ju_TemplateCollections$ImmutableArrayList();
    ju_TemplateCollections$ImmutableArrayList__init_(var_1, var_0);
    return var_1;
},
ju_TemplateCollections$ImmutableArrayList__init_0 = ($this, $collection) => {
    let $list, $iter, $index, $element, var$6, $index_0;
    ju_TemplateCollections$AbstractImmutableList__init_($this);
    $list = $rt_createArray(jl_Object, $collection.$size());
    $iter = $collection.$iterator();
    $index = 0;
    while ($iter.$hasNext()) {
        $element = $iter.$next();
        if ($element === null)
            $rt_throw(jl_NullPointerException__init_());
        var$6 = $list.data;
        $index_0 = $index + 1 | 0;
        var$6[$index] = $element;
        $index = $index_0;
    }
    $this.$list = $list;
},
ju_TemplateCollections$ImmutableArrayList__init_2 = var_0 => {
    let var_1 = new ju_TemplateCollections$ImmutableArrayList();
    ju_TemplateCollections$ImmutableArrayList__init_0(var_1, var_0);
    return var_1;
},
ju_TemplateCollections$ImmutableArrayList_get = ($this, $index) => {
    return $this.$list.data[$index];
},
ju_TemplateCollections$ImmutableArrayList_size = $this => {
    return $this.$list.data.length;
};
function oajq_CircuitLevel$verify$lambda$_5_1() {
    jl_Object.call(this);
    this.$_018 = null;
}
let oajq_CircuitLevel$verify$lambda$_5_1__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_018 = var$1;
},
oajq_CircuitLevel$verify$lambda$_5_1__init_0 = var_0 => {
    let var_1 = new oajq_CircuitLevel$verify$lambda$_5_1();
    oajq_CircuitLevel$verify$lambda$_5_1__init_(var_1, var_0);
    return var_1;
},
oajq_CircuitLevel$verify$lambda$_5_1_test0 = (var$0, var$1) => {
    return oajq_CircuitLevel$verify$lambda$_5_1_test(var$0, var$1);
},
oajq_CircuitLevel$verify$lambda$_5_1_test = (var$0, var$1) => {
    return var$0.$_018.$contains(var$1);
},
oajq_CircuitLevel$verify$lambda$_5_0 = $rt_classWithoutFields(),
oajq_CircuitLevel$verify$lambda$_5_0__init_ = var$0 => {
    jl_Object__init_(var$0);
},
oajq_CircuitLevel$verify$lambda$_5_0__init_0 = () => {
    let var_0 = new oajq_CircuitLevel$verify$lambda$_5_0();
    oajq_CircuitLevel$verify$lambda$_5_0__init_(var_0);
    return var_0;
},
oajq_CircuitLevel$verify$lambda$_5_0_apply0 = (var$0, var$1) => {
    return oajq_CircuitLevel$verify$lambda$_5_0_apply(var$0, var$1);
},
oajq_CircuitLevel$verify$lambda$_5_0_apply = (var$0, var$1) => {
    return oajq_CircuitLevel_lambda$verify$0(var$1);
};
function oajvs_CircuitSpec() {
    let a = this; jl_Record.call(a);
    a.$version0 = 0;
    a.$numQubits0 = 0;
    a.$levels1 = null;
}
let oajvs_CircuitSpec__init_ = ($this, $version, $numQubits, $levels) => {
    let var$4;
    jl_Record__init_($this);
    var$4 = ju_List_copyOf($levels);
    $this.$version0 = $version;
    $this.$numQubits0 = $numQubits;
    $this.$levels1 = var$4;
},
oajvs_CircuitSpec__init_0 = (var_0, var_1, var_2) => {
    let var_3 = new oajvs_CircuitSpec();
    oajvs_CircuitSpec__init_(var_3, var_0, var_1, var_2);
    return var_3;
},
oajvs_CircuitSpec_numQubits = $this => {
    return $this.$numQubits0;
},
oajvs_CircuitSpec_levels = $this => {
    return $this.$levels1;
},
otcit_DoubleAnalyzer = $rt_classWithoutFields(),
otcit_DoubleAnalyzer_MAX_MANTISSA = Long_ZERO,
otcit_DoubleAnalyzer_resultForLog10 = null,
otcit_DoubleAnalyzer_mantissa10Table = null,
otcit_DoubleAnalyzer_exp10Table = null,
otcit_DoubleAnalyzer_$callClinit = () => {
    otcit_DoubleAnalyzer_$callClinit = $rt_eraseClinit(otcit_DoubleAnalyzer);
    otcit_DoubleAnalyzer__clinit_();
},
otcit_DoubleAnalyzer_analyze = ($d, $result) => {
    let $bits, $mantissa, $exponent, var$6, $decExponent, var$8, var$9, $binExponentCorrection, $mantissaShift, $decMantissa, var$13, var$14, var$15, $decMantissaHi, $decMantissaLow, $lowerPos, $upperPos, $posCmp;
    otcit_DoubleAnalyzer_$callClinit();
    $bits = jl_Double_doubleToLongBits($d);
    $result.$sign1 = Long_eq(Long_and($bits, Long_create(0, 2147483648)), Long_ZERO) ? 0 : 1;
    $mantissa = Long_and($bits, Long_create(4294967295, 1048575));
    $exponent = Long_lo(Long_shr($bits, 52)) & 2047;
    if (Long_eq($mantissa, Long_ZERO) && !$exponent) {
        $result.$mantissa = Long_ZERO;
        $result.$exponent = 0;
        return;
    }
    if ($exponent)
        var$6 = Long_or($mantissa, Long_create(0, 1048576));
    else {
        var$6 = Long_shl($mantissa, 1);
        while (Long_eq(Long_and(var$6, Long_create(0, 1048576)), Long_ZERO)) {
            var$6 = Long_shl(var$6, 1);
            $exponent = $exponent + (-1) | 0;
        }
    }
    $decExponent = ju_Arrays_binarySearch(otcit_DoubleAnalyzer_exp10Table, $exponent << 16 >> 16);
    if ($decExponent < 0)
        $decExponent =  -$decExponent | 0;
    var$8 = otcit_DoubleAnalyzer_exp10Table.data;
    var$9 = $decExponent + 1 | 0;
    $binExponentCorrection = $exponent - var$8[var$9] | 0;
    $mantissaShift = 12 + $binExponentCorrection | 0;
    $decMantissa = otcit_DoubleAnalyzer_mulAndShiftRight(var$6, otcit_DoubleAnalyzer_mantissa10Table.data[var$9], $mantissaShift);
    if (Long_le($decMantissa, otcit_DoubleAnalyzer_MAX_MANTISSA)) {
        while (jl_Long_compareUnsigned($decMantissa, otcit_DoubleAnalyzer_MAX_MANTISSA) <= 0) {
            $decExponent = $decExponent + (-1) | 0;
            $decMantissa = Long_add(Long_mul($decMantissa, Long_fromInt(10)), Long_fromInt(9));
        }
        var$8 = otcit_DoubleAnalyzer_exp10Table.data;
        var$9 = $decExponent + 1 | 0;
        var$13 = $exponent - var$8[var$9] | 0;
        $mantissaShift = 12 + var$13 | 0;
        $decMantissa = otcit_DoubleAnalyzer_mulAndShiftRight(var$6, otcit_DoubleAnalyzer_mantissa10Table.data[var$9], $mantissaShift);
    }
    var$14 = Long_shl(var$6, 1);
    var$6 = Long_add(var$14, Long_fromInt(1));
    var$8 = otcit_DoubleAnalyzer_mantissa10Table.data;
    var$13 = $decExponent + 1 | 0;
    var$15 = var$8[var$13];
    var$9 = $mantissaShift - 1 | 0;
    $decMantissaHi = otcit_DoubleAnalyzer_mulAndShiftRight(var$6, var$15, var$9);
    $decMantissaLow = otcit_DoubleAnalyzer_mulAndShiftRight(Long_sub(var$14, Long_fromInt(1)), otcit_DoubleAnalyzer_mantissa10Table.data[var$13], var$9);
    $lowerPos = otcit_DoubleAnalyzer_findLowerDistance($decMantissa, $decMantissaLow);
    $upperPos = otcit_DoubleAnalyzer_findUpperDistance($decMantissa, $decMantissaHi);
    $posCmp = jl_Long_compareUnsigned($lowerPos, $upperPos);
    var$6 = $posCmp > 0 ? Long_mul(jl_Long_divideUnsigned($decMantissa, $lowerPos), $lowerPos) : $posCmp < 0 ? Long_add(Long_mul(jl_Long_divideUnsigned($decMantissa, $upperPos), $upperPos), $upperPos) : Long_mul(jl_Long_divideUnsigned(Long_add($decMantissa, Long_div($upperPos, Long_fromInt(2))), $upperPos), $upperPos);
    if (jl_Long_compareUnsigned(var$6, Long_create(2808348672, 232830643)) >= 0)
        while (true) {
            $decExponent = $decExponent + 1 | 0;
            var$6 = jl_Long_divideUnsigned(var$6, Long_fromInt(10));
            if (jl_Long_compareUnsigned(var$6, Long_create(2808348672, 232830643)) < 0)
                break;
        }
    else if (jl_Long_compareUnsigned(var$6, Long_create(1569325056, 23283064)) < 0) {
        $decExponent = $decExponent + (-1) | 0;
        var$6 = Long_mul(var$6, Long_fromInt(10));
    }
    $result.$mantissa = var$6;
    $result.$exponent = $decExponent - 330 | 0;
},
otcit_DoubleAnalyzer_findLowerDistance = ($mantissa, $lower) => {
    let $pos, $pos_0, var$5, var$6;
    otcit_DoubleAnalyzer_$callClinit();
    $pos = Long_fromInt(1);
    while (true) {
        $pos_0 = Long_mul($pos, Long_fromInt(10));
        var$5 = jl_Long_divideUnsigned($mantissa, $pos_0);
        var$6 = jl_Long_divideUnsigned($lower, $pos_0);
        if (jl_Long_compareUnsigned(var$5, var$6) <= 0)
            break;
        $pos = $pos_0;
    }
    return $pos;
},
otcit_DoubleAnalyzer_findUpperDistance = ($mantissa, $upper) => {
    let $pos, $pos_0, var$5, var$6;
    otcit_DoubleAnalyzer_$callClinit();
    $pos = Long_fromInt(1);
    while (true) {
        $pos_0 = Long_mul($pos, Long_fromInt(10));
        var$5 = jl_Long_divideUnsigned($mantissa, $pos_0);
        var$6 = jl_Long_divideUnsigned($upper, $pos_0);
        if (jl_Long_compareUnsigned(var$5, var$6) >= 0)
            break;
        $pos = $pos_0;
    }
    return $pos;
},
otcit_DoubleAnalyzer_mulAndShiftRight = ($a, $b, $shift) => {
    let $a1, $a2, $a3, $a4, $b1, $b2, $b3, $b4, $cm, $c0, $c1, $c2, $c3, $c, var$18;
    otcit_DoubleAnalyzer_$callClinit();
    $a1 = Long_and($a, Long_fromInt(65535));
    $a2 = Long_and(Long_shru($a, 16), Long_fromInt(65535));
    $a3 = Long_and(Long_shru($a, 32), Long_fromInt(65535));
    $a4 = Long_and(Long_shru($a, 48), Long_fromInt(65535));
    $b1 = Long_and($b, Long_fromInt(65535));
    $b2 = Long_and(Long_shru($b, 16), Long_fromInt(65535));
    $b3 = Long_and(Long_shru($b, 32), Long_fromInt(65535));
    $b4 = Long_and(Long_shru($b, 48), Long_fromInt(65535));
    $cm = Long_add(Long_add(Long_mul($b3, $a1), Long_mul($b2, $a2)), Long_mul($b1, $a3));
    $c0 = Long_add(Long_add(Long_add(Long_mul($b4, $a1), Long_mul($b3, $a2)), Long_mul($b2, $a3)), Long_mul($b1, $a4));
    $c1 = Long_add(Long_add(Long_mul($b4, $a2), Long_mul($b3, $a3)), Long_mul($b2, $a4));
    $c2 = Long_add(Long_mul($b4, $a3), Long_mul($b3, $a4));
    $c3 = Long_mul($b4, $a4);
    $c = Long_add(Long_add(Long_shl($c3, 32 + $shift | 0), Long_shl($c2, 16 + $shift | 0)), Long_shl($c1, $shift));
    var$18 = Long_add($cm, Long_shl($c0, 16));
    var$18 = Long_add($c, Long_shru(var$18, 32 - $shift | 0));
    return var$18;
},
otcit_DoubleAnalyzer__clinit_ = () => {
    otcit_DoubleAnalyzer_MAX_MANTISSA = jl_Long_divideUnsigned(Long_fromInt(-1), Long_fromInt(10));
    otcit_DoubleAnalyzer_resultForLog10 = otcit_DoubleAnalyzer$Result__init_();
    otcit_DoubleAnalyzer_mantissa10Table = $rt_createLongArrayFromData([Long_create(3251292512, 2194092222), Long_create(1766094183, 3510547556), Long_create(553881887, 2808438045), Long_create(443105509, 2246750436), Long_create(3285949193, 3594800697), Long_create(910772436, 2875840558), Long_create(2446604867, 2300672446), Long_create(2196580869, 3681075914), Long_create(2616258154, 2944860731), Long_create(1234013064, 2355888585), Long_create(1974420903, 3769421736), Long_create(720543263, 3015537389), Long_create(1435428070, 2412429911),
    Long_create(578697993, 3859887858), Long_create(2180945313, 3087910286), Long_create(885762791, 2470328229), Long_create(3135207384, 3952525166), Long_create(1649172448, 3162020133), Long_create(3037324877, 2529616106), Long_create(3141732885, 4047385770), Long_create(2513386308, 3237908616), Long_create(1151715587, 2590326893), Long_create(983751480, 4144523029), Long_create(1645994643, 3315618423), Long_create(3034782633, 2652494738), Long_create(3996658754, 4243991581), Long_create(2338333544, 3395193265),
    Long_create(1870666835, 2716154612), Long_create(4073513845, 2172923689), Long_create(3940641775, 3476677903), Long_create(575533043, 2781342323), Long_create(2178413352, 2225073858), Long_create(2626467905, 3560118173), Long_create(3819161242, 2848094538), Long_create(478348616, 2278475631), Long_create(3342338164, 3645561009), Long_create(3532863990, 2916448807), Long_create(1108304273, 2333159046), Long_create(55299919, 3733054474), Long_create(903233395, 2986443579), Long_create(1581580175, 2389154863),
    Long_create(1671534821, 3822647781), Long_create(478234397, 3058118225), Long_create(382587518, 2446494580), Long_create(612140029, 3914391328), Long_create(2207698941, 3131513062), Long_create(48172235, 2505210450), Long_create(77075576, 4008336720), Long_create(61660460, 3206669376), Long_create(3485302205, 2565335500), Long_create(1281516232, 4104536801), Long_create(166219527, 3283629441), Long_create(3568949458, 2626903552), Long_create(2274345296, 4203045684), Long_create(2678469696, 3362436547), Long_create(424788838, 2689949238),
    Long_create(2057817989, 2151959390), Long_create(3292508783, 3443135024), Long_create(3493000485, 2754508019), Long_create(3653393847, 2203606415), Long_create(1550462860, 3525770265), Long_create(1240370288, 2820616212), Long_create(3569276608, 2256492969), Long_create(3133862195, 3610388751), Long_create(1648096297, 2888311001), Long_create(459483578, 2310648801), Long_create(3312154103, 3697038081), Long_create(1790729823, 2957630465), Long_create(1432583858, 2366104372), Long_create(3151127633, 3785766995),
    Long_create(2520902106, 3028613596), Long_create(1157728226, 2422890877), Long_create(2711358621, 3876625403), Long_create(3887073815, 3101300322), Long_create(1391672133, 2481040258), Long_create(1367681954, 3969664413), Long_create(2812132482, 3175731530), Long_create(2249705985, 2540585224), Long_create(1022549199, 4064936359), Long_create(1677032818, 3251949087), Long_create(3918606632, 2601559269), Long_create(3692790234, 4162494831), Long_create(2095238728, 3329995865), Long_create(1676190982, 2663996692),
    Long_create(3540899031, 4262394707), Long_create(1114732307, 3409915766), Long_create(32792386, 2727932613), Long_create(1744220827, 2182346090), Long_create(2790753324, 3491753744), Long_create(3091596118, 2793402995), Long_create(2473276894, 2234722396), Long_create(2239256113, 3575555834), Long_create(2650398349, 2860444667), Long_create(402331761, 2288355734), Long_create(2361717736, 3661369174), Long_create(2748367648, 2929095339), Long_create(3057687578, 2343276271), Long_create(3174313206, 3749242034),
    Long_create(3398444024, 2999393627), Long_create(1000768301, 2399514902), Long_create(2460222741, 3839223843), Long_create(3686165111, 3071379074), Long_create(3807925548, 2457103259), Long_create(3515700499, 3931365215), Long_create(2812560399, 3145092172), Long_create(532061401, 2516073738), Long_create(4287272078, 4025717980), Long_create(3429817663, 3220574384), Long_create(3602847589, 2576459507), Long_create(2328582306, 4122335212), Long_create(144878926, 3297868170), Long_create(115903141, 2638294536),
    Long_create(2762425404, 4221271257), Long_create(491953404, 3377017006), Long_create(3829536560, 2701613604), Long_create(3922622707, 2161290883), Long_create(1122235577, 3458065414), Long_create(1756781920, 2766452331), Long_create(546432077, 2213161865), Long_create(874291324, 3541058984), Long_create(1558426518, 2832847187), Long_create(3823721592, 2266277749), Long_create(3540974170, 3626044399), Long_create(3691772795, 2900835519), Long_create(3812411695, 2320668415), Long_create(1804891416, 3713069465),
    Long_create(1443913133, 2970455572), Long_create(3732110884, 2376364457), Long_create(2535403578, 3802183132), Long_create(310335944, 3041746506), Long_create(3684242592, 2433397204), Long_create(3317807769, 3893435527), Long_create(936259297, 3114748422), Long_create(3325987815, 2491798737), Long_create(1885606668, 3986877980), Long_create(1508485334, 3189502384), Long_create(2065781726, 2551601907), Long_create(4164244222, 4082563051), Long_create(2472401918, 3266050441), Long_create(1118928075, 2612840353),
    Long_create(931291461, 4180544565), Long_create(745033169, 3344435652), Long_create(3173006913, 2675548521), Long_create(3358824142, 4280877634), Long_create(3546052773, 3424702107), Long_create(1118855300, 2739761686), Long_create(36090780, 2191809349), Long_create(1775732167, 3506894958), Long_create(3138572652, 2805515966), Long_create(1651864662, 2244412773), Long_create(1783990001, 3591060437), Long_create(4004172378, 2872848349), Long_create(4062331362, 2298278679), Long_create(3922749802, 3677245887),
    Long_create(1420212923, 2941796710), Long_create(1136170338, 2353437368), Long_create(958879082, 3765499789), Long_create(1626096725, 3012399831), Long_create(441883920, 2409919865), Long_create(707014273, 3855871784), Long_create(1424604878, 3084697427), Long_create(3716664280, 2467757941), Long_create(4228675929, 3948412706), Long_create(2523947284, 3158730165), Long_create(2019157827, 2526984132), Long_create(4089645983, 4043174611), Long_create(2412723327, 3234539689), Long_create(2789172121, 2587631751),
    Long_create(2744688475, 4140210802), Long_create(477763862, 3312168642), Long_create(2959191467, 2649734913), Long_create(3875712888, 4239575861), Long_create(2241576851, 3391660689), Long_create(2652254940, 2713328551), Long_create(1262810493, 2170662841), Long_create(302509870, 3473060546), Long_create(3677981733, 2778448436), Long_create(2083391927, 2222758749), Long_create(756446706, 3556413999), Long_create(1464150824, 2845131199), Long_create(2030314118, 2276104959), Long_create(671522212, 3641767935),
    Long_create(537217769, 2913414348), Long_create(2147761134, 2330731478), Long_create(2577424355, 3729170365), Long_create(2061939484, 2983336292), Long_create(4226531965, 2386669033), Long_create(1608490388, 3818670454), Long_create(2145785770, 3054936363), Long_create(3434615534, 2443949090), Long_create(1200417559, 3910318545), Long_create(960334047, 3128254836), Long_create(4204241074, 2502603868), Long_create(1572824964, 4004166190), Long_create(1258259971, 3203332952), Long_create(3583588354, 2562666361),
    Long_create(4015754449, 4100266178), Long_create(635623181, 3280212943), Long_create(2226485463, 2624170354), Long_create(985396364, 4198672567), Long_create(3365297469, 3358938053), Long_create(115257597, 2687150443), Long_create(1810192996, 2149720354), Long_create(319328417, 3439552567), Long_create(2832443111, 2751642053), Long_create(3983941407, 2201313642), Long_create(2938332415, 3522101828), Long_create(4068652850, 2817681462), Long_create(1536935362, 2254145170), Long_create(2459096579, 3606632272),
    Long_create(249290345, 2885305818), Long_create(1917419194, 2308244654), Long_create(490890333, 3693191447), Long_create(2969692644, 2954553157), Long_create(657767197, 2363642526), Long_create(3629407892, 3781828041), Long_create(2044532855, 3025462433), Long_create(3353613202, 2420369946), Long_create(3647794205, 3872591914), Long_create(3777228823, 3098073531), Long_create(2162789599, 2478458825), Long_create(3460463359, 3965534120), Long_create(2768370687, 3172427296), Long_create(1355703090, 2537941837),
    Long_create(3028118404, 4060706939), Long_create(3281488183, 3248565551), Long_create(1766197087, 2598852441), Long_create(1107928421, 4158163906), Long_create(27349277, 3326531125), Long_create(21879422, 2661224900), Long_create(35007075, 4257959840), Long_create(28005660, 3406367872), Long_create(2599384905, 2725094297), Long_create(361521006, 2180075438), Long_create(4014407446, 3488120700), Long_create(3211525957, 2790496560), Long_create(2569220766, 2232397248), Long_create(3251759766, 3571835597),
    Long_create(883420894, 2857468478), Long_create(2424723634, 2285974782), Long_create(443583977, 3657559652), Long_create(2931847559, 2926047721), Long_create(1486484588, 2340838177), Long_create(3237368801, 3745341083), Long_create(12914663, 2996272867), Long_create(2587312108, 2397018293), Long_create(3280705914, 3835229269), Long_create(3483558190, 3068183415), Long_create(2786846552, 2454546732), Long_create(1022980646, 3927274772), Long_create(3395364895, 3141819817), Long_create(998304997, 2513455854),
    Long_create(3315274914, 4021529366), Long_create(1793226472, 3217223493), Long_create(3152568096, 2573778794), Long_create(2467128576, 4118046071), Long_create(1114709402, 3294436857), Long_create(3468747899, 2635549485), Long_create(1255029343, 4216879177), Long_create(3581003852, 3373503341), Long_create(2005809622, 2698802673), Long_create(3322634616, 2159042138), Long_create(162254630, 3454467422), Long_create(2706784082, 2763573937), Long_create(447440347, 2210859150), Long_create(715904555, 3537374640),
    Long_create(572723644, 2829899712), Long_create(3035159293, 2263919769), Long_create(2279274491, 3622271631), Long_create(964426134, 2897817305), Long_create(771540907, 2318253844), Long_create(2952452370, 3709206150), Long_create(2361961896, 2967364920), Long_create(1889569516, 2373891936), Long_create(1305324308, 3798227098), Long_create(2762246365, 3038581678), Long_create(3927784010, 2430865342), Long_create(2848480580, 3889384548), Long_create(3996771382, 3111507638), Long_create(620436728, 2489206111),
    Long_create(3569679143, 3982729777), Long_create(1137756396, 3186183822), Long_create(3487185494, 2548947057), Long_create(2143522954, 4078315292), Long_create(4291798741, 3262652233), Long_create(856458615, 2610121787), Long_create(2229327243, 4176194859), Long_create(2642455254, 3340955887), Long_create(395977285, 2672764710), Long_create(633563656, 4276423536), Long_create(3942824761, 3421138828), Long_create(577279431, 2736911063), Long_create(2179810463, 2189528850), Long_create(3487696741, 3503246160),
    Long_create(2790157393, 2802596928), Long_create(3950112833, 2242077542), Long_create(2884206696, 3587324068), Long_create(4025352275, 2869859254), Long_create(4079275279, 2295887403), Long_create(1372879692, 3673419846), Long_create(239310294, 2938735877), Long_create(2768428613, 2350988701), Long_create(2711498862, 3761581922), Long_create(451212171, 3009265538), Long_create(2078956655, 2407412430), Long_create(3326330649, 3851859888), Long_create(84084141, 3081487911), Long_create(3503241150, 2465190328),
    Long_create(451225085, 3944304526), Long_create(3796953905, 3155443620), Long_create(3037563124, 2524354896), Long_create(3142114080, 4038967834), Long_create(3372684723, 3231174267), Long_create(980160860, 2584939414), Long_create(3286244294, 4135903062), Long_create(911008517, 3308722450), Long_create(728806813, 2646977960), Long_create(1166090902, 4235164736), Long_create(73879262, 3388131789), Long_create(918096869, 2710505431), Long_create(4170451332, 2168404344), Long_create(4095741754, 3469446951),
    Long_create(2417599944, 2775557561), Long_create(1075086496, 2220446049), Long_create(3438125312, 3552713678), Long_create(173519872, 2842170943), Long_create(1856802816, 2273736754), Long_create(393904128, 3637978807), Long_create(2892103680, 2910383045), Long_create(2313682944, 2328306436), Long_create(1983905792, 3725290298), Long_create(3305111552, 2980232238), Long_create(67108864, 2384185791), Long_create(2684354560, 3814697265), Long_create(2147483648, 3051757812), Long_create(0, 2441406250), Long_create(0, 3906250000),
    Long_create(0, 3125000000), Long_create(0, 2500000000), Long_create(0, 4000000000), Long_create(0, 3200000000), Long_create(0, 2560000000), Long_create(0, 4096000000), Long_create(0, 3276800000), Long_create(0, 2621440000), Long_create(0, 4194304000), Long_create(0, 3355443200), Long_create(0, 2684354560), Long_create(0, 2147483648), Long_create(3435973836, 3435973836), Long_create(1889785610, 2748779069), Long_create(2370821947, 2199023255), Long_create(3793315115, 3518437208), Long_create(457671715, 2814749767),
    Long_create(2943117749, 2251799813), Long_create(3849994940, 3602879701), Long_create(2221002492, 2882303761), Long_create(917808535, 2305843009), Long_create(3186480574, 3689348814), Long_create(3408177918, 2951479051), Long_create(1867548875, 2361183241), Long_create(1270091283, 3777893186), Long_create(157079567, 3022314549), Long_create(984657113, 2417851639), Long_create(3293438299, 3868562622), Long_create(916763721, 3094850098), Long_create(2451397895, 2475880078), Long_create(3063243173, 3961408125),
    Long_create(2450594538, 3169126500), Long_create(1960475630, 2535301200), Long_create(3136761009, 4056481920), Long_create(2509408807, 3245185536), Long_create(1148533586, 2596148429), Long_create(3555640657, 4153837486), Long_create(1985519066, 3323069989), Long_create(2447408712, 2658455991), Long_create(2197867021, 4253529586), Long_create(899300158, 3402823669), Long_create(1578433585, 2722258935), Long_create(1262746868, 2177807148), Long_create(1161401530, 3484491437), Long_create(3506101601, 2787593149),
    Long_create(3663874740, 2230074519), Long_create(3285219207, 3568119231), Long_create(1769181906, 2854495385), Long_create(1415345525, 2283596308), Long_create(1405559381, 3653754093), Long_create(2842434423, 2923003274), Long_create(3132940998, 2338402619), Long_create(2435725219, 3741444191), Long_create(1089586716, 2993155353), Long_create(2589656291, 2394524282), Long_create(707476229, 3831238852), Long_create(3142961361, 3064991081), Long_create(1655375629, 2451992865), Long_create(2648601007, 3923188584),
    Long_create(2977874265, 3138550867), Long_create(664312493, 2510840694), Long_create(2780886908, 4017345110), Long_create(2224709526, 3213876088), Long_create(3497754539, 2571100870), Long_create(1301439967, 4113761393), Long_create(2759138892, 3291009114), Long_create(3066304573, 2632807291), Long_create(3188100398, 4212491666), Long_create(1691486859, 3369993333), Long_create(3071176406, 2695994666), Long_create(1597947665, 2156795733), Long_create(1697722806, 3450873173), Long_create(3076165163, 2760698538),
    Long_create(4178919049, 2208558830), Long_create(2391303182, 3533694129), Long_create(2772036005, 2826955303), Long_create(3935615722, 2261564242), Long_create(2861011319, 3618502788), Long_create(4006795973, 2894802230), Long_create(3205436779, 2315841784), Long_create(2551718468, 3705346855), Long_create(2041374775, 2964277484), Long_create(2492093279, 2371421987), Long_create(551375410, 3794275180), Long_create(441100328, 3035420144), Long_create(1211873721, 2428336115), Long_create(1938997954, 3885337784),
    Long_create(2410191822, 3108270227), Long_create(210166539, 2486616182), Long_create(1195259923, 3978585891), Long_create(97214479, 3182868713), Long_create(1795758501, 2546294970), Long_create(2873213602, 4074071952), Long_create(580583963, 3259257562), Long_create(3041447548, 2607406049), Long_create(2289335700, 4171849679), Long_create(2690462019, 3337479743), Long_create(3870356534, 2669983794), Long_create(3615590076, 4271974071), Long_create(2033478602, 3417579257), Long_create(4203763259, 2734063405),
    Long_create(3363010607, 2187250724), Long_create(2803836594, 3499601159), Long_create(3102062734, 2799680927), Long_create(763663269, 2239744742), Long_create(2080854690, 3583591587), Long_create(4241664129, 2866873269), Long_create(4252324763, 2293498615), Long_create(2508752324, 3669597785), Long_create(2007001859, 2935678228), Long_create(3323588406, 2348542582), Long_create(1881767613, 3757668132), Long_create(4082394468, 3006134505), Long_create(3265915574, 2404907604), Long_create(2648484541, 3847852167),
    Long_create(400800715, 3078281734), Long_create(1179634031, 2462625387), Long_create(2746407909, 3940200619), Long_create(3056119786, 3152160495), Long_create(2444895829, 2521728396), Long_create(2193846408, 4034765434), Long_create(2614070585, 3227812347), Long_create(373269550, 2582249878), Long_create(4033205117, 4131599804), Long_create(4085557553, 3305279843), Long_create(691465664, 2644223875), Long_create(1106345063, 4230758200), Long_create(885076050, 3384606560), Long_create(708060840, 2707685248),
    Long_create(2284435591, 2166148198), Long_create(2796103486, 3465837117), Long_create(518895870, 2772669694), Long_create(1274110155, 2218135755), Long_create(2038576249, 3549017208), Long_create(3348847917, 2839213766), Long_create(1820084875, 2271371013), Long_create(2053142340, 3634193621), Long_create(783520413, 2907354897), Long_create(3203796708, 2325883917), Long_create(1690100896, 3721414268), Long_create(3070067635, 2977131414), Long_create(3315047567, 2381705131), Long_create(3586089190, 3810728210),
    Long_create(2868871352, 3048582568), Long_create(4013084000, 2438866054), Long_create(3843954022, 3902185687), Long_create(1357176299, 3121748550), Long_create(1085741039, 2497398840), Long_create(1737185663, 3995838144), Long_create(2248741989, 3196670515), Long_create(1798993591, 2557336412), Long_create(3737383206, 4091738259), Long_create(3848900024, 3273390607), Long_create(1361133101, 2618712486), Long_create(459826043, 4189939978), Long_create(2085847752, 3351951982), Long_create(4245658579, 2681561585),
    Long_create(2498086431, 4290498537), Long_create(280482227, 3432398830), Long_create(224385781, 2745919064), Long_create(1038502084, 2196735251), Long_create(4238583712, 3514776401), Long_create(2531873511, 2811821121), Long_create(1166505349, 2249456897), Long_create(2725402018, 3599131035), Long_create(2180321615, 2879304828), Long_create(3462244210, 2303443862), Long_create(2103616899, 3685510180), Long_create(1682893519, 2948408144), Long_create(2205308275, 2358726515), Long_create(3528493240, 3773962424),
    Long_create(3681788051, 3019169939), Long_create(3804423900, 2415335951), Long_create(74124026, 3864537523), Long_create(1777286139, 3091630018), Long_create(3139815829, 2473304014), Long_create(2446724950, 3957286423), Long_create(3675366878, 3165829138), Long_create(363313125, 2532663311), Long_create(3158281377, 4052261297), Long_create(808638183, 3241809038), Long_create(2364897465, 2593447230), Long_create(3783835944, 4149515568), Long_create(450088378, 3319612455), Long_create(360070702, 2655689964),
    Long_create(2294100042, 4249103942), Long_create(117293115, 3399283154), Long_create(952827951, 2719426523), Long_create(2480249279, 2175541218), Long_create(3109405388, 3480865949), Long_create(3346517769, 2784692759), Long_create(3536207675, 2227754207), Long_create(2221958443, 3564406732), Long_create(59579836, 2851525386), Long_create(3483637705, 2281220308), Long_create(419859574, 3649952494), Long_create(1194881118, 2919961995), Long_create(955904894, 2335969596), Long_create(4106428209, 3737551353),
    Long_create(708162189, 2990041083), Long_create(2284516670, 2392032866), Long_create(1937239754, 3827252586), Long_create(690798344, 3061802069), Long_create(1411632134, 2449441655), Long_create(2258611415, 3919106648), Long_create(3524876050, 3135285318), Long_create(242920462, 2508228255), Long_create(388672740, 4013165208), Long_create(2028925110, 3210532166), Long_create(764146629, 2568425733), Long_create(363641147, 4109481173), Long_create(2008899836, 3287584938), Long_create(3325106787, 2630067950),
    Long_create(1025203564, 4208108721), Long_create(4256136688, 3366486976), Long_create(2545915891, 2693189581), Long_create(1177739254, 2154551665), Long_create(1884382806, 3447282664), Long_create(2366499704, 2757826131), Long_create(1034206304, 2206260905), Long_create(1654730086, 3530017448), Long_create(3041770987, 2824013958), Long_create(4151403708, 2259211166), Long_create(629291719, 3614737867), Long_create(3080413753, 2891790293), Long_create(4182317920, 2313432234), Long_create(4114728295, 3701491575),
    Long_create(3291782636, 2961193260), Long_create(2633426109, 2368954608), Long_create(3354488315, 3790327373), Long_create(106610275, 3032261899), Long_create(944281679, 2425809519), Long_create(3228837605, 3881295230), Long_create(2583070084, 3105036184), Long_create(2925449526, 2484028947), Long_create(1244745405, 3974446316), Long_create(136802865, 3179557053), Long_create(1827429210, 2543645642), Long_create(3782880196, 4069833027), Long_create(1308317238, 3255866422), Long_create(3623634168, 2604693137),
    Long_create(2361840832, 4167509020), Long_create(1889472666, 3334007216), Long_create(652584673, 2667205773), Long_create(185142018, 4267529237), Long_create(2725093992, 3414023389), Long_create(3039068653, 2731218711), Long_create(1572261463, 2184974969), Long_create(4233605259, 3495959950), Long_create(3386884207, 2796767960), Long_create(2709507366, 2237414368), Long_create(3476218326, 3579862989), Long_create(3639968120, 2863890391), Long_create(2052981037, 2291112313), Long_create(2425776200, 3665779701),
    Long_create(1081627501, 2932623761), Long_create(6308541, 2346099009), Long_create(1728080585, 3753758414), Long_create(2241457927, 3003006731), Long_create(934172882, 2402405385), Long_create(1494676612, 3843848616), Long_create(336747830, 3075078893), Long_create(1987385183, 2460063114), Long_create(602835915, 3936100983), Long_create(2200255650, 3148880786), Long_create(901211061, 2519104629), Long_create(3159924616, 4030567406), Long_create(1668946233, 3224453925), Long_create(1335156987, 2579563140),
    Long_create(2136251179, 4127301024), Long_create(2567994402, 3301840819), Long_create(2913388981, 2641472655), Long_create(366455074, 4226356249), Long_create(1152157518, 3381084999), Long_create(1780719474, 2704867999), Long_create(2283569038, 2163894399), Long_create(1076730083, 3462231039), Long_create(1720377526, 2769784831), Long_create(517308561, 2215827865), Long_create(827693699, 3545324584), Long_create(1521148418, 2836259667), Long_create(3793899112, 2269007733), Long_create(916277824, 3630412374),
    Long_create(1592015718, 2904329899), Long_create(2132606034, 2323463919), Long_create(835189277, 3717542271), Long_create(4104125258, 2974033816), Long_create(2424306747, 2379227053), Long_create(3019897337, 3806763285), Long_create(2415917869, 3045410628), Long_create(3650721214, 2436328502), Long_create(2405180105, 3898125604), Long_create(2783137543, 3118500483), Long_create(3944496953, 2494800386), Long_create(298240911, 3991680619), Long_create(1097586188, 3193344495), Long_create(878068950, 2554675596),
    Long_create(3981890698, 4087480953), Long_create(608532181, 3269984763), Long_create(2204812663, 2615987810), Long_create(3527700261, 4185580496), Long_create(1963166749, 3348464397), Long_create(4147513777, 2678771517), Long_create(3200048207, 4286034428), Long_create(4278025484, 3428827542), Long_create(1704433468, 2743062034), Long_create(2222540234, 2194449627), Long_create(120090538, 3511119404), Long_create(955065889, 2808895523), Long_create(2482039630, 2247116418), Long_create(3112269949, 3595386269),
    Long_create(3348809418, 2876309015), Long_create(2679047534, 2301047212), Long_create(850502218, 3681675540), Long_create(680401775, 2945340432), Long_create(3121301797, 2356272345), Long_create(699115580, 3770035753), Long_create(2277279382, 3016028602), Long_create(103836587, 2412822882), Long_create(1025131999, 3860516611), Long_create(4256079436, 3088413288), Long_create(827883168, 2470730631), Long_create(3901593088, 3953169009)]);
    otcit_DoubleAnalyzer_exp10Table = $rt_createShortArrayFromData([(-70), (-66), (-63), (-60), (-56), (-53), (-50), (-46), (-43), (-40), (-36), (-33), (-30), (-26), (-23), (-20), (-16), (-13), (-10), (-6), (-3), 0, 4, 7, 10, 14, 17, 20, 23, 27, 30, 33, 37, 40, 43, 47, 50, 53, 57, 60, 63, 67, 70, 73, 77, 80, 83, 87, 90, 93, 97, 100, 103, 107, 110, 113, 116, 120, 123, 126, 130, 133, 136, 140, 143, 146, 150, 153, 156, 160, 163, 166, 170, 173, 176, 180, 183, 186, 190, 193, 196, 200, 203, 206, 210, 213, 216, 219,
    223, 226, 229, 233, 236, 239, 243, 246, 249, 253, 256, 259, 263, 266, 269, 273, 276, 279, 283, 286, 289, 293, 296, 299, 303, 306, 309, 312, 316, 319, 322, 326, 329, 332, 336, 339, 342, 346, 349, 352, 356, 359, 362, 366, 369, 372, 376, 379, 382, 386, 389, 392, 396, 399, 402, 406, 409, 412, 415, 419, 422, 425, 429, 432, 435, 439, 442, 445, 449, 452, 455, 459, 462, 465, 469, 472, 475, 479, 482, 485, 489, 492, 495, 499, 502, 505, 508, 512, 515, 518, 522, 525, 528, 532, 535, 538, 542, 545, 548, 552, 555, 558,
    562, 565, 568, 572, 575, 578, 582, 585, 588, 592, 595, 598, 601, 605, 608, 611, 615, 618, 621, 625, 628, 631, 635, 638, 641, 645, 648, 651, 655, 658, 661, 665, 668, 671, 675, 678, 681, 685, 688, 691, 695, 698, 701, 704, 708, 711, 714, 718, 721, 724, 728, 731, 734, 738, 741, 744, 748, 751, 754, 758, 761, 764, 768, 771, 774, 778, 781, 784, 788, 791, 794, 797, 801, 804, 807, 811, 814, 817, 821, 824, 827, 831, 834, 837, 841, 844, 847, 851, 854, 857, 861, 864, 867, 871, 874, 877, 881, 884, 887, 891, 894, 897,
    900, 904, 907, 910, 914, 917, 920, 924, 927, 930, 934, 937, 940, 944, 947, 950, 954, 957, 960, 964, 967, 970, 974, 977, 980, 984, 987, 990, 993, 997, 1000, 1003, 1007, 1010, 1013, 1017, 1020, 1023, 1027, 1030, 1033, 1037, 1040, 1043, 1047, 1050, 1053, 1057, 1060, 1063, 1067, 1070, 1073, 1077, 1080, 1083, 1086, 1090, 1093, 1096, 1100, 1103, 1106, 1110, 1113, 1116, 1120, 1123, 1126, 1130, 1133, 1136, 1140, 1143, 1146, 1150, 1153, 1156, 1160, 1163, 1166, 1170, 1173, 1176, 1180, 1183, 1186, 1189, 1193, 1196,
    1199, 1203, 1206, 1209, 1213, 1216, 1219, 1223, 1226, 1229, 1233, 1236, 1239, 1243, 1246, 1249, 1253, 1256, 1259, 1263, 1266, 1269, 1273, 1276, 1279, 1282, 1286, 1289, 1292, 1296, 1299, 1302, 1306, 1309, 1312, 1316, 1319, 1322, 1326, 1329, 1332, 1336, 1339, 1342, 1346, 1349, 1352, 1356, 1359, 1362, 1366, 1369, 1372, 1376, 1379, 1382, 1385, 1389, 1392, 1395, 1399, 1402, 1405, 1409, 1412, 1415, 1419, 1422, 1425, 1429, 1432, 1435, 1439, 1442, 1445, 1449, 1452, 1455, 1459, 1462, 1465, 1469, 1472, 1475, 1478,
    1482, 1485, 1488, 1492, 1495, 1498, 1502, 1505, 1508, 1512, 1515, 1518, 1522, 1525, 1528, 1532, 1535, 1538, 1542, 1545, 1548, 1552, 1555, 1558, 1562, 1565, 1568, 1572, 1575, 1578, 1581, 1585, 1588, 1591, 1595, 1598, 1601, 1605, 1608, 1611, 1615, 1618, 1621, 1625, 1628, 1631, 1635, 1638, 1641, 1645, 1648, 1651, 1655, 1658, 1661, 1665, 1668, 1671, 1674, 1678, 1681, 1684, 1688, 1691, 1694, 1698, 1701, 1704, 1708, 1711, 1714, 1718, 1721, 1724, 1728, 1731, 1734, 1738, 1741, 1744, 1748, 1751, 1754, 1758, 1761,
    1764, 1767, 1771, 1774, 1777, 1781, 1784, 1787, 1791, 1794, 1797, 1801, 1804, 1807, 1811, 1814, 1817, 1821, 1824, 1827, 1831, 1834, 1837, 1841, 1844, 1847, 1851, 1854, 1857, 1861, 1864, 1867, 1870, 1874, 1877, 1880, 1884, 1887, 1890, 1894, 1897, 1900, 1904, 1907, 1910, 1914, 1917, 1920, 1924, 1927, 1930, 1934, 1937, 1940, 1944, 1947, 1950, 1954, 1957, 1960, 1963, 1967, 1970, 1973, 1977, 1980, 1983, 1987, 1990, 1993, 1997, 2000, 2003, 2007, 2010, 2013, 2017, 2020, 2023, 2027, 2030, 2033, 2037, 2040, 2043,
    2047, 2050, 2053, 2057, 2060, 2063, 2066, 2070, 2073, 2076, 2080, 2083, 2086, 2090, 2093, 2096, 2100, 2103, 2106, 2110, 2113, 2116, 2120]);
};
function jusi_CountingConsumer() {
    jl_Object.call(this);
    this.$count1 = 0;
}
let jusi_CountingConsumer__init_ = $this => {
    jl_Object__init_($this);
},
jusi_CountingConsumer__init_0 = () => {
    let var_0 = new jusi_CountingConsumer();
    jusi_CountingConsumer__init_(var_0);
    return var_0;
},
jusi_CountingConsumer_test = ($this, $t) => {
    $this.$count1 = $this.$count1 + 1 | 0;
    return 1;
},
otr_StringInfo = $rt_classWithoutFields(otrr_ReflectionInfo);
function otciu_CharMapping() {
    let a = this; jl_Object.call(a);
    a.$binarySearchTable0 = null;
    a.$fastTable = null;
}
let otciu_CharMapping__init_ = ($this, $binarySearchTable, $fastTable) => {
    jl_Object__init_($this);
    $this.$binarySearchTable0 = $binarySearchTable;
    $this.$fastTable = $fastTable;
},
otciu_CharMapping__init_0 = (var_0, var_1) => {
    let var_2 = new otciu_CharMapping();
    otciu_CharMapping__init_(var_2, var_0, var_1);
    return var_2;
},
oajqg_Swap = $rt_classWithoutFields(oajqg_Gate),
oajqg_Swap__init_ = ($this, $firstQubit, $secondQubit) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 2, oaju_Constants_SWAP_MATRIX, $rt_s(23), $rt_wrapArray(jl_Integer, [$firstQubit, $secondQubit]));
},
oajqg_Swap__init_0 = (var_0, var_1) => {
    let var_2 = new oajqg_Swap();
    oajqg_Swap__init_(var_2, var_0, var_1);
    return var_2;
};
function otci_CharFlow() {
    let a = this; jl_Object.call(a);
    a.$characters = null;
    a.$pointer = 0;
}
let otci_CharFlow__init_ = ($this, $characters) => {
    jl_Object__init_($this);
    $this.$characters = $characters;
},
otci_CharFlow__init_0 = var_0 => {
    let var_1 = new otci_CharFlow();
    otci_CharFlow__init_(var_1, var_0);
    return var_1;
};
function jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0() {
    jl_Object.call(this);
    this.$_09 = null;
}
let jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_09 = var$1;
},
jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0__init_0 = var_0 => {
    let var_1 = new jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0();
    jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0__init_(var_1, var_0);
    return var_1;
},
jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0_test = (var$0, var$1) => {
    return jusi_SimpleStreamIterator_lambda$fetchIfNeeded$1(var$0.$_09, var$1);
};
function jusi_RangeIntStream() {
    let a = this; jusi_SimpleIntStreamImpl.call(a);
    a.$start = 0;
    a.$end = 0;
}
let jusi_RangeIntStream__init_ = ($this, $start, $end) => {
    jusi_SimpleIntStreamImpl__init_($this);
    $this.$start = $start;
    $this.$end = $end;
},
jusi_RangeIntStream__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_RangeIntStream();
    jusi_RangeIntStream__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_RangeIntStream_next = ($this, $consumer) => {
    let var$2;
    while ($this.$start < $this.$end) {
        var$2 = $this.$start;
        $this.$start = var$2 + 1 | 0;
        if ($consumer.$test2(var$2))
            continue;
        else
            return 1;
    }
    return 0;
},
otcit_DoubleSynthesizer = $rt_classWithoutFields(),
otcit_DoubleSynthesizer_mantissa10Table = null,
otcit_DoubleSynthesizer_exp10Table = null,
otcit_DoubleSynthesizer_$callClinit = () => {
    otcit_DoubleSynthesizer_$callClinit = $rt_eraseClinit(otcit_DoubleSynthesizer);
    otcit_DoubleSynthesizer__clinit_();
},
otcit_DoubleSynthesizer_synthesizeDouble = ($mantissa, $exp, $negative) => {
    let $indexInTable, $binMantissa, $binExp, $binMantissaShift, var$8, var$9, $mantissaLowerBits, $mantissaLowerPos, $error, $correction, $binMantissaWithoutError, $low, $hi, var$17, var$18, $cmp, $iee754;
    otcit_DoubleSynthesizer_$callClinit();
    $indexInTable = 330 + $exp | 0;
    if (Long_ne($mantissa, Long_ZERO) && $indexInTable >= 0) {
        if ($indexInTable >= otcit_DoubleSynthesizer_mantissa10Table.data.length)
            return !$negative ? Infinity : (-Infinity);
        $binMantissa = otcit_DoubleAnalyzer_mulAndShiftRight($mantissa, otcit_DoubleSynthesizer_mantissa10Table.data[$indexInTable], 0);
        $binExp = otcit_DoubleSynthesizer_exp10Table.data[$indexInTable];
        $binMantissaShift = (64 - jl_Long_numberOfLeadingZeros($binMantissa) | 0) - 58 | 0;
        var$8 = $binMantissaShift >= 0 ? Long_shru($binMantissa, $binMantissaShift) : Long_shl($binMantissa,  -$binMantissaShift | 0);
        var$9 = $binExp + $binMantissaShift | 0;
        if (var$9 >= 2047)
            return !$negative ? Infinity : (-Infinity);
        $mantissaLowerBits = 5;
        $mantissaLowerPos = 32;
        $error = Long_lo(Long_and(var$8, Long_fromInt(31)));
        $correction = 16;
        if (jl_Math_abs($error - 16 | 0) <= 1) {
            $binMantissaWithoutError = Long_and(var$8, Long_fromInt(-32));
            $low = otcit_DoubleSynthesizer_calcDecMantissa($binMantissaWithoutError, $mantissaLowerPos, $indexInTable, var$9);
            $hi = otcit_DoubleSynthesizer_calcDecMantissa(Long_add($binMantissaWithoutError, Long_fromInt(32)), $mantissaLowerPos, $indexInTable, var$9);
            var$17 = Long_sub($mantissa, $low);
            var$18 = Long_sub($hi, $mantissa);
            $cmp = jl_Long_compareUnsigned(var$17, var$18);
            if ($cmp < 0)
                $correction =  -$error | 0;
            else if ($cmp > 0)
                $correction = $mantissaLowerPos - $error | 0;
        }
        var$8 = Long_add(var$8, Long_fromInt($correction));
        if (Long_ne(Long_and(var$8, Long_create(0, 4227858432)), Long_ZERO)) {
            var$8 = Long_shru(var$8, 1);
            var$9 = var$9 + 1 | 0;
        }
        if (var$9 <= 0) {
            var$8 = Long_shr(var$8, jl_Math_min(( -var$9 | 0) + 1 | 0, 64));
            var$9 = 0;
        }
        var$8 = Long_and(Long_shru(var$8, $mantissaLowerBits), Long_create(4294967295, 1048575));
        $iee754 = Long_or(var$8, Long_shl(Long_fromInt(var$9), 52));
        if ($negative)
            $iee754 = Long_xor($iee754, Long_create(0, 2147483648));
        return $rt_longBitsToDouble($iee754);
    }
    return $rt_longBitsToDouble((!$negative ? Long_ZERO : Long_create(0, 2147483648)));
},
otcit_DoubleSynthesizer_calcDecMantissa = ($mantissa, $lowerBit, $indexInTable, $binExp) => {
    let $half, $shift, $decMantissa, var$8, $decMantissaHi, $decMantissaLow, $lowerPos, $upperPos, $posCmp;
    otcit_DoubleSynthesizer_$callClinit();
    $half = $lowerBit >>> 1 | 0;
    otcit_DoubleAnalyzer_$callClinit();
    $shift = 7 - (otcit_DoubleAnalyzer_exp10Table.data[$indexInTable] - $binExp | 0) | 0;
    $decMantissa = otcit_DoubleAnalyzer_mulAndShiftRight($mantissa, otcit_DoubleAnalyzer_mantissa10Table.data[$indexInTable], $shift);
    var$8 = Long_fromInt($half);
    $decMantissaHi = otcit_DoubleAnalyzer_mulAndShiftRight(Long_add($mantissa, var$8), otcit_DoubleAnalyzer_mantissa10Table.data[$indexInTable], $shift);
    $decMantissaLow = otcit_DoubleAnalyzer_mulAndShiftRight(Long_sub($mantissa, var$8), otcit_DoubleAnalyzer_mantissa10Table.data[$indexInTable], $shift);
    $lowerPos = otcit_DoubleAnalyzer_findLowerDistance($decMantissa, $decMantissaLow);
    $upperPos = otcit_DoubleAnalyzer_findUpperDistance($decMantissa, $decMantissaHi);
    $posCmp = jl_Long_compareUnsigned($lowerPos, $upperPos);
    var$8 = $posCmp > 0 ? Long_mul(jl_Long_divideUnsigned($decMantissa, $lowerPos), $lowerPos) : $posCmp < 0 ? Long_add(Long_mul(jl_Long_divideUnsigned($decMantissa, $upperPos), $upperPos), $upperPos) : Long_mul(jl_Long_divideUnsigned(Long_add($decMantissa, Long_div($upperPos, Long_fromInt(2))), $upperPos), $upperPos);
    return var$8;
},
otcit_DoubleSynthesizer__clinit_ = () => {
    otcit_DoubleSynthesizer_mantissa10Table = $rt_createLongArrayFromData([Long_create(136053384, 4203730336), Long_create(85033365, 2627331460), Long_create(106291706, 3284164325), Long_create(1206606457, 4105205406), Long_create(3975354508, 2565753378), Long_create(2821709486, 3207191723), Long_create(2453395034, 4008989654), Long_create(459630072, 2505618534), Long_create(2722021238, 3132023167), Long_create(2328784724, 3915028959), Long_create(3066103188, 2446893099), Long_create(2758887162, 3058616374),
    Long_create(1301125304, 3823270468), Long_create(2960686963, 2389544042), Long_create(1553375056, 2986930053), Long_create(3015460644, 3733662566), Long_create(810921078, 2333539104), Long_create(1013651348, 2916923880), Long_create(1267064185, 3646154850), Long_create(1865656940, 2278846781), Long_create(3405812998, 2848558476), Long_create(4257266248, 3560698095), Long_create(4271404141, 2225436309), Long_create(2118029704, 2781795387), Long_create(1573795306, 3477244234), Long_create(2057363890, 2173277646),
    Long_create(424221215, 2716597058), Long_create(2677760167, 3395746322), Long_create(1199716561, 4244682903), Long_create(2360435586, 2652926814), Long_create(803060835, 3316158518), Long_create(3151309692, 4145198147), Long_create(1432697645, 2590748842), Long_create(3938355705, 3238436052), Long_create(627977335, 4048045066), Long_create(1466227658, 2530028166), Long_create(3980268221, 3162535207), Long_create(3901593452, 3953169009), Long_create(827883171, 2470730631), Long_create(4256079436, 3088413288),
    Long_create(1025131999, 3860516611), Long_create(103836588, 2412822882), Long_create(2277279383, 3016028602), Long_create(699115580, 3770035753), Long_create(3121301798, 2356272345), Long_create(680401775, 2945340432), Long_create(850502219, 3681675540), Long_create(2679047535, 2301047212), Long_create(3348809418, 2876309015), Long_create(3112269949, 3595386269), Long_create(2482039630, 2247116418), Long_create(955065890, 2808895523), Long_create(120090538, 3511119404), Long_create(2222540234, 2194449627),
    Long_create(1704433469, 2743062034), Long_create(4278025484, 3428827542), Long_create(3200048207, 4286034428), Long_create(4147513777, 2678771517), Long_create(1963166750, 3348464397), Long_create(3527700261, 4185580496), Long_create(2204812663, 2615987810), Long_create(608532181, 3269984763), Long_create(3981890698, 4087480953), Long_create(878068951, 2554675596), Long_create(1097586188, 3193344495), Long_create(298240911, 3991680619), Long_create(3944496953, 2494800386), Long_create(2783137544, 3118500483),
    Long_create(2405180106, 3898125604), Long_create(3650721214, 2436328502), Long_create(2415917870, 3045410628), Long_create(3019897337, 3806763285), Long_create(2424306748, 2379227053), Long_create(4104125259, 2974033816), Long_create(835189277, 3717542271), Long_create(2132606034, 2323463919), Long_create(1592015719, 2904329899), Long_create(916277825, 3630412374), Long_create(3793899112, 2269007733), Long_create(1521148418, 2836259667), Long_create(827693699, 3545324584), Long_create(517308562, 2215827865),
    Long_create(1720377526, 2769784831), Long_create(1076730084, 3462231039), Long_create(2283569038, 2163894399), Long_create(1780719474, 2704867999), Long_create(1152157519, 3381084999), Long_create(366455074, 4226356249), Long_create(2913388981, 2641472655), Long_create(2567994403, 3301840819), Long_create(2136251179, 4127301024), Long_create(1335156987, 2579563140), Long_create(1668946234, 3224453925), Long_create(3159924616, 4030567406), Long_create(901211061, 2519104629), Long_create(2200255651, 3148880786),
    Long_create(602835915, 3936100983), Long_create(1987385183, 2460063114), Long_create(336747831, 3075078893), Long_create(1494676613, 3843848616), Long_create(934172883, 2402405385), Long_create(2241457928, 3003006731), Long_create(1728080585, 3753758414), Long_create(6308542, 2346099009), Long_create(1081627501, 2932623761), Long_create(2425776201, 3665779701), Long_create(2052981037, 2291112313), Long_create(3639968121, 2863890391), Long_create(3476218327, 3579862989), Long_create(2709507366, 2237414368),
    Long_create(3386884208, 2796767960), Long_create(4233605260, 3495959950), Long_create(1572261463, 2184974969), Long_create(3039068653, 2731218711), Long_create(2725093993, 3414023389), Long_create(185142019, 4267529237), Long_create(652584674, 2667205773), Long_create(1889472666, 3334007216), Long_create(2361840833, 4167509020), Long_create(3623634168, 2604693137), Long_create(1308317239, 3255866422), Long_create(3782880196, 4069833027), Long_create(1827429211, 2543645642), Long_create(136802865, 3179557053),
    Long_create(1244745406, 3974446316), Long_create(2925449527, 2484028947), Long_create(2583070084, 3105036184), Long_create(3228837605, 3881295230), Long_create(944281679, 2425809519), Long_create(106610275, 3032261899), Long_create(3354488316, 3790327373), Long_create(2633426109, 2368954608), Long_create(3291782637, 2961193260), Long_create(4114728296, 3701491575), Long_create(4182317921, 2313432234), Long_create(3080413753, 2891790293), Long_create(629291719, 3614737867), Long_create(4151403709, 2259211166),
    Long_create(3041770988, 2824013958), Long_create(1654730087, 3530017448), Long_create(1034206304, 2206260905), Long_create(2366499704, 2757826131), Long_create(1884382806, 3447282664), Long_create(1177739254, 2154551665), Long_create(2545915892, 2693189581), Long_create(4256136688, 3366486976), Long_create(1025203564, 4208108721), Long_create(3325106788, 2630067950), Long_create(2008899837, 3287584938), Long_create(363641148, 4109481173), Long_create(764146629, 2568425733), Long_create(2028925111, 3210532166),
    Long_create(388672741, 4013165208), Long_create(242920463, 2508228255), Long_create(3524876051, 3135285318), Long_create(2258611415, 3919106648), Long_create(1411632134, 2449441655), Long_create(690798344, 3061802069), Long_create(1937239754, 3827252586), Long_create(2284516670, 2392032866), Long_create(708162190, 2990041083), Long_create(4106428209, 3737551353), Long_create(955904895, 2335969596), Long_create(1194881119, 2919961995), Long_create(419859574, 3649952494), Long_create(3483637706, 2281220308),
    Long_create(59579836, 2851525386), Long_create(2221958443, 3564406732), Long_create(3536207675, 2227754207), Long_create(3346517770, 2784692759), Long_create(3109405388, 3480865949), Long_create(2480249280, 2175541218), Long_create(952827952, 2719426523), Long_create(117293116, 3399283154), Long_create(2294100043, 4249103942), Long_create(360070703, 2655689964), Long_create(450088378, 3319612455), Long_create(3783835945, 4149515568), Long_create(2364897466, 2593447230), Long_create(808638184, 3241809038),
    Long_create(3158281378, 4052261297), Long_create(363313125, 2532663311), Long_create(3675366878, 3165829138), Long_create(2446724950, 3957286423), Long_create(3139815830, 2473304014), Long_create(1777286139, 3091630018), Long_create(74124026, 3864537523), Long_create(3804423900, 2415335951), Long_create(3681788051, 3019169939), Long_create(3528493240, 3773962424), Long_create(2205308275, 2358726515), Long_create(1682893520, 2948408144), Long_create(2103616900, 3685510180), Long_create(3462244210, 2303443862),
    Long_create(2180321615, 2879304828), Long_create(2725402019, 3599131035), Long_create(1166505350, 2249456897), Long_create(2531873511, 2811821121), Long_create(4238583713, 3514776401), Long_create(1038502085, 2196735251), Long_create(224385782, 2745919064), Long_create(280482227, 3432398830), Long_create(2498086432, 4290498537), Long_create(4245658580, 2681561585), Long_create(2085847753, 3351951982), Long_create(459826043, 4189939978), Long_create(1361133101, 2618712486), Long_create(3848900024, 3273390607),
    Long_create(3737383206, 4091738259), Long_create(1798993592, 2557336412), Long_create(2248741990, 3196670515), Long_create(1737185663, 3995838144), Long_create(1085741040, 2497398840), Long_create(1357176300, 3121748550), Long_create(3843954022, 3902185687), Long_create(4013084000, 2438866054), Long_create(2868871352, 3048582568), Long_create(3586089190, 3810728210), Long_create(3315047568, 2381705131), Long_create(3070067636, 2977131414), Long_create(1690100897, 3721414268), Long_create(3203796708, 2325883917),
    Long_create(783520414, 2907354897), Long_create(2053142341, 3634193621), Long_create(1820084875, 2271371013), Long_create(3348847918, 2839213766), Long_create(2038576249, 3549017208), Long_create(1274110156, 2218135755), Long_create(518895871, 2772669694), Long_create(2796103486, 3465837117), Long_create(2284435591, 2166148198), Long_create(708060841, 2707685248), Long_create(885076051, 3384606560), Long_create(1106345064, 4230758200), Long_create(691465665, 2644223875), Long_create(4085557553, 3305279843),
    Long_create(4033205117, 4131599804), Long_create(373269550, 2582249878), Long_create(2614070586, 3227812347), Long_create(2193846408, 4034765434), Long_create(2444895829, 2521728396), Long_create(3056119787, 3152160495), Long_create(2746407909, 3940200619), Long_create(1179634031, 2462625387), Long_create(400800715, 3078281734), Long_create(2648484542, 3847852167), Long_create(3265915575, 2404907604), Long_create(4082394468, 3006134505), Long_create(1881767613, 3757668132), Long_create(3323588406, 2348542582),
    Long_create(2007001860, 2935678228), Long_create(2508752325, 3669597785), Long_create(4252324763, 2293498615), Long_create(4241664130, 2866873269), Long_create(2080854690, 3583591587), Long_create(763663269, 2239744742), Long_create(3102062735, 2799680927), Long_create(2803836594, 3499601159), Long_create(3363010608, 2187250724), Long_create(4203763259, 2734063405), Long_create(2033478602, 3417579257), Long_create(3615590077, 4271974071), Long_create(3870356534, 2669983794), Long_create(2690462020, 3337479743),
    Long_create(2289335700, 4171849679), Long_create(3041447549, 2607406049), Long_create(580583964, 3259257562), Long_create(2873213603, 4074071952), Long_create(1795758502, 2546294970), Long_create(97214479, 3182868713), Long_create(1195259923, 3978585891), Long_create(210166540, 2486616182), Long_create(2410191823, 3108270227), Long_create(1938997955, 3885337784), Long_create(1211873722, 2428336115), Long_create(441100328, 3035420144), Long_create(551375410, 3794275180), Long_create(2492093279, 2371421987),
    Long_create(2041374775, 2964277484), Long_create(2551718469, 3705346855), Long_create(3205436779, 2315841784), Long_create(4006795974, 2894802230), Long_create(2861011319, 3618502788), Long_create(3935615723, 2261564242), Long_create(2772036005, 2826955303), Long_create(2391303183, 3533694129), Long_create(4178919049, 2208558830), Long_create(3076165163, 2760698538), Long_create(1697722806, 3450873173), Long_create(1597947666, 2156795733), Long_create(3071176406, 2695994666), Long_create(1691486860, 3369993333),
    Long_create(3188100399, 4212491666), Long_create(3066304573, 2632807291), Long_create(2759138893, 3291009114), Long_create(1301439968, 4113761393), Long_create(3497754540, 2571100870), Long_create(2224709527, 3213876088), Long_create(2780886909, 4017345110), Long_create(664312494, 2510840694), Long_create(2977874265, 3138550867), Long_create(2648601008, 3923188584), Long_create(1655375630, 2451992865), Long_create(3142961361, 3064991081), Long_create(707476230, 3831238852), Long_create(2589656291, 2394524282),
    Long_create(1089586716, 2993155353), Long_create(2435725219, 3741444191), Long_create(3132940998, 2338402619), Long_create(2842434424, 2923003274), Long_create(1405559382, 3653754093), Long_create(1415345525, 2283596308), Long_create(1769181907, 2854495385), Long_create(3285219208, 3568119231), Long_create(3663874741, 2230074519), Long_create(3506101602, 2787593149), Long_create(1161401530, 3484491437), Long_create(1262746869, 2177807148), Long_create(1578433586, 2722258935), Long_create(899300158, 3402823669),
    Long_create(2197867022, 4253529586), Long_create(2447408712, 2658455991), Long_create(1985519067, 3323069989), Long_create(3555640657, 4153837486), Long_create(1148533587, 2596148429), Long_create(2509408807, 3245185536), Long_create(3136761009, 4056481920), Long_create(1960475631, 2535301200), Long_create(2450594539, 3169126500), Long_create(3063243173, 3961408125), Long_create(2451397895, 2475880078), Long_create(916763721, 3094850098), Long_create(3293438299, 3868562622), Long_create(984657113, 2417851639),
    Long_create(157079567, 3022314549), Long_create(1270091283, 3777893186), Long_create(1867548876, 2361183241), Long_create(3408177919, 2951479051), Long_create(3186480575, 3689348814), Long_create(917808535, 2305843009), Long_create(2221002493, 2882303761), Long_create(3849994940, 3602879701), Long_create(2943117750, 2251799813), Long_create(457671715, 2814749767), Long_create(3793315116, 3518437208), Long_create(2370821947, 2199023255), Long_create(1889785610, 2748779069), Long_create(3435973837, 3435973836),
    Long_create(0, 2147483648), Long_create(0, 2684354560), Long_create(0, 3355443200), Long_create(0, 4194304000), Long_create(0, 2621440000), Long_create(0, 3276800000), Long_create(0, 4096000000), Long_create(0, 2560000000), Long_create(0, 3200000000), Long_create(0, 4000000000), Long_create(0, 2500000000), Long_create(0, 3125000000), Long_create(0, 3906250000), Long_create(0, 2441406250), Long_create(2147483648, 3051757812), Long_create(2684354560, 3814697265), Long_create(67108864, 2384185791), Long_create(3305111552, 2980232238),
    Long_create(1983905792, 3725290298), Long_create(2313682944, 2328306436), Long_create(2892103680, 2910383045), Long_create(393904128, 3637978807), Long_create(1856802816, 2273736754), Long_create(173519872, 2842170943), Long_create(3438125312, 3552713678), Long_create(1075086496, 2220446049), Long_create(2417599944, 2775557561), Long_create(4095741754, 3469446951), Long_create(4170451332, 2168404344), Long_create(918096869, 2710505431), Long_create(73879263, 3388131789), Long_create(1166090902, 4235164736),
    Long_create(728806814, 2646977960), Long_create(911008517, 3308722450), Long_create(3286244295, 4135903062), Long_create(980160860, 2584939414), Long_create(3372684723, 3231174267), Long_create(3142114080, 4038967834), Long_create(3037563124, 2524354896), Long_create(3796953905, 3155443620), Long_create(451225085, 3944304526), Long_create(3503241150, 2465190328), Long_create(84084142, 3081487911), Long_create(3326330649, 3851859888), Long_create(2078956656, 2407412430), Long_create(451212172, 3009265538),
    Long_create(2711498863, 3761581922), Long_create(2768428613, 2350988701), Long_create(239310295, 2938735877), Long_create(1372879692, 3673419846), Long_create(4079275280, 2295887403), Long_create(4025352276, 2869859254), Long_create(2884206696, 3587324068), Long_create(3950112833, 2242077542), Long_create(2790157394, 2802596928), Long_create(3487696742, 3503246160), Long_create(2179810464, 2189528850), Long_create(577279432, 2736911063), Long_create(3942824762, 3421138828), Long_create(633563656, 4276423536),
    Long_create(395977285, 2672764710), Long_create(2642455254, 3340955887), Long_create(2229327244, 4176194859), Long_create(856458615, 2610121787), Long_create(4291798741, 3262652233), Long_create(2143522955, 4078315292), Long_create(3487185495, 2548947057), Long_create(1137756396, 3186183822), Long_create(3569679143, 3982729777), Long_create(620436729, 2489206111), Long_create(3996771383, 3111507638), Long_create(2848480580, 3889384548), Long_create(3927784011, 2430865342), Long_create(2762246365, 3038581678),
    Long_create(1305324309, 3798227098), Long_create(1889569517, 2373891936), Long_create(2361961896, 2967364920), Long_create(2952452370, 3709206150), Long_create(771540907, 2318253844), Long_create(964426134, 2897817305), Long_create(2279274492, 3622271631), Long_create(3035159293, 2263919769), Long_create(572723645, 2829899712), Long_create(715904556, 3537374640), Long_create(447440347, 2210859150), Long_create(2706784082, 2763573937), Long_create(162254631, 3454467422), Long_create(3322634616, 2159042138),
    Long_create(2005809622, 2698802673), Long_create(3581003852, 3373503341), Long_create(1255029343, 4216879177), Long_create(3468747899, 2635549485), Long_create(1114709402, 3294436857), Long_create(2467128577, 4118046071), Long_create(3152568096, 2573778794), Long_create(1793226473, 3217223493), Long_create(3315274915, 4021529366), Long_create(998304998, 2513455854), Long_create(3395364895, 3141819817), Long_create(1022980647, 3927274772), Long_create(2786846552, 2454546732), Long_create(3483558190, 3068183415),
    Long_create(3280705914, 3835229269), Long_create(2587312108, 2397018293), Long_create(12914663, 2996272867), Long_create(3237368801, 3745341083), Long_create(1486484589, 2340838177), Long_create(2931847560, 2926047721), Long_create(443583978, 3657559652), Long_create(2424723634, 2285974782), Long_create(883420895, 2857468478), Long_create(3251759766, 3571835597), Long_create(2569220766, 2232397248), Long_create(3211525958, 2790496560), Long_create(4014407447, 3488120700), Long_create(361521006, 2180075438),
    Long_create(2599384906, 2725094297), Long_create(28005660, 3406367872), Long_create(35007075, 4257959840), Long_create(21879422, 2661224900), Long_create(27349278, 3326531125), Long_create(1107928421, 4158163906), Long_create(1766197087, 2598852441), Long_create(3281488183, 3248565551), Long_create(3028118405, 4060706939), Long_create(1355703091, 2537941837), Long_create(2768370688, 3172427296), Long_create(3460463360, 3965534120), Long_create(2162789600, 2478458825), Long_create(3777228824, 3098073531),
    Long_create(3647794206, 3872591914), Long_create(3353613203, 2420369946), Long_create(2044532855, 3025462433), Long_create(3629407893, 3781828041), Long_create(657767197, 2363642526), Long_create(2969692644, 2954553157), Long_create(490890333, 3693191447), Long_create(1917419194, 2308244654), Long_create(249290345, 2885305818), Long_create(2459096579, 3606632272), Long_create(1536935362, 2254145170), Long_create(4068652851, 2817681462), Long_create(2938332415, 3522101828), Long_create(3983941407, 2201313642),
    Long_create(2832443111, 2751642053), Long_create(319328417, 3439552567), Long_create(1810192997, 2149720354), Long_create(115257598, 2687150443), Long_create(3365297469, 3358938053), Long_create(985396365, 4198672567), Long_create(2226485464, 2624170354), Long_create(635623182, 3280212943), Long_create(4015754449, 4100266178), Long_create(3583588355, 2562666361), Long_create(1258259972, 3203332952), Long_create(1572824965, 4004166190), Long_create(4204241075, 2502603868), Long_create(960334048, 3128254836),
    Long_create(1200417559, 3910318545), Long_create(3434615535, 2443949090), Long_create(2145785770, 3054936363), Long_create(1608490389, 3818670454), Long_create(4226531965, 2386669033), Long_create(2061939484, 2983336292), Long_create(2577424355, 3729170365), Long_create(2147761134, 2330731478), Long_create(537217770, 2913414348), Long_create(671522212, 3641767935), Long_create(2030314119, 2276104959), Long_create(1464150824, 2845131199), Long_create(756446706, 3556413999), Long_create(2083391927, 2222758749),
    Long_create(3677981733, 2778448436), Long_create(302509871, 3473060546), Long_create(1262810493, 2170662841), Long_create(2652254940, 2713328551), Long_create(2241576851, 3391660689), Long_create(3875712888, 4239575861), Long_create(2959191467, 2649734913), Long_create(477763862, 3312168642), Long_create(2744688476, 4140210802), Long_create(2789172121, 2587631751), Long_create(2412723328, 3234539689), Long_create(4089645983, 4043174611), Long_create(2019157828, 2526984132), Long_create(2523947285, 3158730165),
    Long_create(4228675930, 3948412706), Long_create(3716664280, 2467757941), Long_create(1424604878, 3084697427), Long_create(707014274, 3855871784), Long_create(441883921, 2409919865), Long_create(1626096725, 3012399831), Long_create(958879083, 3765499789), Long_create(1136170339, 2353437368), Long_create(1420212923, 2941796710), Long_create(3922749802, 3677245887), Long_create(4062331362, 2298278679), Long_create(4004172379, 2872848349), Long_create(1783990002, 3591060437), Long_create(1651864663, 2244412773),
    Long_create(3138572653, 2805515966), Long_create(1775732168, 3506894958), Long_create(36090781, 2191809349), Long_create(1118855300, 2739761686), Long_create(3546052773, 3424702107), Long_create(3358824142, 4280877634), Long_create(3173006913, 2675548521), Long_create(745033169, 3344435652), Long_create(931291462, 4180544565), Long_create(1118928076, 2612840353), Long_create(2472401918, 3266050441), Long_create(4164244222, 4082563051), Long_create(2065781727, 2551601907), Long_create(1508485334, 3189502384),
    Long_create(1885606668, 3986877980), Long_create(3325987816, 2491798737), Long_create(936259297, 3114748422), Long_create(3317807770, 3893435527), Long_create(3684242592, 2433397204), Long_create(310335944, 3041746506), Long_create(2535403578, 3802183132), Long_create(3732110884, 2376364457), Long_create(1443913133, 2970455572), Long_create(1804891417, 3713069465), Long_create(3812411696, 2320668415), Long_create(3691772795, 2900835519), Long_create(3540974170, 3626044399), Long_create(3823721592, 2266277749),
    Long_create(1558426518, 2832847187), Long_create(874291324, 3541058984), Long_create(546432078, 2213161865), Long_create(1756781921, 2766452331), Long_create(1122235577, 3458065414), Long_create(3922622708, 2161290883), Long_create(3829536561, 2701613604), Long_create(491953405, 3377017006), Long_create(2762425404, 4221271257), Long_create(115903142, 2638294536), Long_create(144878927, 3297868170), Long_create(2328582307, 4122335212), Long_create(3602847590, 2576459507), Long_create(3429817663, 3220574384),
    Long_create(4287272079, 4025717980), Long_create(532061401, 2516073738), Long_create(2812560400, 3145092172), Long_create(3515700500, 3931365215), Long_create(3807925548, 2457103259), Long_create(3686165111, 3071379074), Long_create(2460222741, 3839223843), Long_create(1000768301, 2399514902), Long_create(3398444024, 2999393627), Long_create(3174313207, 3749242034), Long_create(3057687578, 2343276271), Long_create(2748367649, 2929095339), Long_create(2361717737, 3661369174), Long_create(402331761, 2288355734),
    Long_create(2650398350, 2860444667), Long_create(2239256113, 3575555834), Long_create(2473276895, 2234722396), Long_create(3091596119, 2793402995), Long_create(2790753324, 3491753744), Long_create(1744220828, 2182346090), Long_create(32792387, 2727932613), Long_create(1114732307, 3409915766), Long_create(3540899032, 4262394707), Long_create(1676190983, 2663996692), Long_create(2095238729, 3329995865), Long_create(3692790235, 4162494831), Long_create(3918606633, 2601559269), Long_create(1677032819, 3251949087),
    Long_create(1022549200, 4064936359), Long_create(2249705986, 2540585224), Long_create(2812132482, 3175731530), Long_create(1367681955, 3969664413), Long_create(1391672134, 2481040258), Long_create(3887073815, 3101300322), Long_create(2711358621, 3876625403), Long_create(1157728226, 2422890877), Long_create(2520902107, 3028613596), Long_create(3151127633, 3785766995), Long_create(1432583859, 2366104372), Long_create(1790729824, 2957630465), Long_create(3312154103, 3697038081), Long_create(459483579, 2310648801),
    Long_create(1648096297, 2888311001), Long_create(3133862196, 3610388751), Long_create(3569276608, 2256492969), Long_create(1240370288, 2820616212), Long_create(1550462860, 3525770265), Long_create(3653393848, 2203606415), Long_create(3493000486, 2754508019), Long_create(3292508783, 3443135024), Long_create(2057817989, 2151959390), Long_create(424788839, 2689949238), Long_create(2678469697, 3362436547), Long_create(2274345297, 4203045684), Long_create(3568949458, 2626903552), Long_create(166219527, 3283629441),
    Long_create(1281516233, 4104536801), Long_create(3485302206, 2565335500), Long_create(61660461, 3206669376), Long_create(77075576, 4008336720), Long_create(48172235, 2505210450), Long_create(2207698942, 3131513062), Long_create(612140029, 3914391328), Long_create(382587518, 2446494580), Long_create(478234398, 3058118225), Long_create(1671534821, 3822647781), Long_create(1581580175, 2389154863), Long_create(903233395, 2986443579), Long_create(55299920, 3733054474), Long_create(1108304274, 2333159046)]);
    otcit_DoubleSynthesizer_exp10Table = $rt_createShortArrayFromData([(-76), (-72), (-69), (-66), (-62), (-59), (-56), (-52), (-49), (-46), (-42), (-39), (-36), (-32), (-29), (-26), (-22), (-19), (-16), (-12), (-9), (-6), (-2), 1, 4, 8, 11, 14, 17, 21, 24, 27, 31, 34, 37, 41, 44, 47, 51, 54, 57, 61, 64, 67, 71, 74, 77, 81, 84, 87, 91, 94, 97, 101, 104, 107, 110, 114, 117, 120, 124, 127, 130, 134, 137, 140, 144, 147, 150, 154, 157, 160, 164, 167, 170, 174, 177, 180, 184, 187, 190, 194, 197, 200, 204, 207, 210,
    213, 217, 220, 223, 227, 230, 233, 237, 240, 243, 247, 250, 253, 257, 260, 263, 267, 270, 273, 277, 280, 283, 287, 290, 293, 297, 300, 303, 306, 310, 313, 316, 320, 323, 326, 330, 333, 336, 340, 343, 346, 350, 353, 356, 360, 363, 366, 370, 373, 376, 380, 383, 386, 390, 393, 396, 400, 403, 406, 409, 413, 416, 419, 423, 426, 429, 433, 436, 439, 443, 446, 449, 453, 456, 459, 463, 466, 469, 473, 476, 479, 483, 486, 489, 493, 496, 499, 502, 506, 509, 512, 516, 519, 522, 526, 529, 532, 536, 539, 542, 546, 549,
    552, 556, 559, 562, 566, 569, 572, 576, 579, 582, 586, 589, 592, 595, 599, 602, 605, 609, 612, 615, 619, 622, 625, 629, 632, 635, 639, 642, 645, 649, 652, 655, 659, 662, 665, 669, 672, 675, 679, 682, 685, 689, 692, 695, 698, 702, 705, 708, 712, 715, 718, 722, 725, 728, 732, 735, 738, 742, 745, 748, 752, 755, 758, 762, 765, 768, 772, 775, 778, 782, 785, 788, 791, 795, 798, 801, 805, 808, 811, 815, 818, 821, 825, 828, 831, 835, 838, 841, 845, 848, 851, 855, 858, 861, 865, 868, 871, 875, 878, 881, 885, 888,
    891, 894, 898, 901, 904, 908, 911, 914, 918, 921, 924, 928, 931, 934, 938, 941, 944, 948, 951, 954, 958, 961, 964, 968, 971, 974, 978, 981, 984, 987, 991, 994, 997, 1001, 1004, 1007, 1011, 1014, 1017, 1021, 1024, 1027, 1031, 1034, 1037, 1041, 1044, 1047, 1051, 1054, 1057, 1061, 1064, 1067, 1071, 1074, 1077, 1081, 1084, 1087, 1090, 1094, 1097, 1100, 1104, 1107, 1110, 1114, 1117, 1120, 1124, 1127, 1130, 1134, 1137, 1140, 1144, 1147, 1150, 1154, 1157, 1160, 1164, 1167, 1170, 1174, 1177, 1180, 1183, 1187, 1190,
    1193, 1197, 1200, 1203, 1207, 1210, 1213, 1217, 1220, 1223, 1227, 1230, 1233, 1237, 1240, 1243, 1247, 1250, 1253, 1257, 1260, 1263, 1267, 1270, 1273, 1276, 1280, 1283, 1286, 1290, 1293, 1296, 1300, 1303, 1306, 1310, 1313, 1316, 1320, 1323, 1326, 1330, 1333, 1336, 1340, 1343, 1346, 1350, 1353, 1356, 1360, 1363, 1366, 1370, 1373, 1376, 1379, 1383, 1386, 1389, 1393, 1396, 1399, 1403, 1406, 1409, 1413, 1416, 1419, 1423, 1426, 1429, 1433, 1436, 1439, 1443, 1446, 1449, 1453, 1456, 1459, 1463, 1466, 1469, 1472,
    1476, 1479, 1482, 1486, 1489, 1492, 1496, 1499, 1502, 1506, 1509, 1512, 1516, 1519, 1522, 1526, 1529, 1532, 1536, 1539, 1542, 1546, 1549, 1552, 1556, 1559, 1562, 1566, 1569, 1572, 1575, 1579, 1582, 1585, 1589, 1592, 1595, 1599, 1602, 1605, 1609, 1612, 1615, 1619, 1622, 1625, 1629, 1632, 1635, 1639, 1642, 1645, 1649, 1652, 1655, 1659, 1662, 1665, 1668, 1672, 1675, 1678, 1682, 1685, 1688, 1692, 1695, 1698, 1702, 1705, 1708, 1712, 1715, 1718, 1722, 1725, 1728, 1732, 1735, 1738, 1742, 1745, 1748, 1752, 1755,
    1758, 1761, 1765, 1768, 1771, 1775, 1778, 1781, 1785, 1788, 1791, 1795, 1798, 1801, 1805, 1808, 1811, 1815, 1818, 1821, 1825, 1828, 1831, 1835, 1838, 1841, 1845, 1848, 1851, 1855, 1858, 1861, 1864, 1868, 1871, 1874, 1878, 1881, 1884, 1888, 1891, 1894, 1898, 1901, 1904, 1908, 1911, 1914, 1918, 1921, 1924, 1928, 1931, 1934, 1938, 1941, 1944, 1948, 1951, 1954, 1957, 1961, 1964, 1967, 1971, 1974, 1977, 1981, 1984, 1987, 1991, 1994, 1997, 2001, 2004, 2007, 2011, 2014, 2017, 2021, 2024, 2027, 2031, 2034, 2037,
    2041, 2044, 2047, 2051, 2054, 2057, 2060, 2064, 2067, 2070, 2074, 2077, 2080, 2084, 2087, 2090, 2094, 2097, 2100, 2104, 2107, 2110, 2114]);
};
function jusi_FlatMappingStreamImpl() {
    let a = this; jusi_SimpleStreamImpl.call(a);
    a.$sourceStream1 = null;
    a.$currentSet = 0;
    a.$current = null;
    a.$iterator1 = null;
    a.$mapper0 = null;
    a.$done = 0;
}
let jusi_FlatMappingStreamImpl__init_ = ($this, $sourceStream, $mapper) => {
    jusi_SimpleStreamImpl__init_($this);
    $this.$sourceStream1 = $sourceStream;
    $this.$mapper0 = $mapper;
},
jusi_FlatMappingStreamImpl__init_0 = (var_0, var_1) => {
    let var_2 = new jusi_FlatMappingStreamImpl();
    jusi_FlatMappingStreamImpl__init_(var_2, var_0, var_1);
    return var_2;
},
jusi_FlatMappingStreamImpl_next = ($this, $consumer) => {
    let $hasMore, $castCurrent, $e;
    if ($this.$current === null) {
        if ($this.$done)
            return 0;
        $this.$currentSet = 0;
        a: {
            while (true) {
                if ($this.$currentSet)
                    break a;
                $hasMore = $this.$sourceStream1.$next0(jusi_FlatMappingStreamImpl$next$lambda$_1_0__init_0($this));
                if (!$hasMore)
                    break;
            }
            $this.$done = 1;
        }
        if ($this.$current === null)
            return 0;
    }
    b: {
        if ($this.$current instanceof jusi_SimpleStreamImpl) {
            $castCurrent = $this.$current;
            if ($castCurrent.$next0($consumer))
                return 1;
            $this.$current.$close();
            $this.$current = null;
        } else {
            $this.$iterator1 = $this.$current.$iterator();
            while (true) {
                if (!$this.$iterator1.$hasNext()) {
                    $this.$current.$close();
                    $this.$iterator1 = null;
                    $this.$current = null;
                    break b;
                }
                $e = $this.$iterator1.$next();
                if (!$consumer.$test1($e))
                    break;
            }
            return 1;
        }
    }
    return 1;
},
jusi_FlatMappingStreamImpl_lambda$next$0 = ($this, $e) => {
    $this.$current = $this.$mapper0.$apply0($e);
    $this.$currentSet = 1;
    return 0;
},
oajqg_PauliZ = $rt_classWithoutFields(oajqg_Gate),
oajqg_PauliZ__init_ = ($this, $indexes) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 1, oaju_Constants_PAULI_Z_MATRIX, $rt_s(14), $indexes);
},
oajqg_PauliZ__init_0 = var_0 => {
    let var_1 = new oajqg_PauliZ();
    oajqg_PauliZ__init_(var_1, var_0);
    return var_1;
},
otcit_FloatAnalyzer$Result = $rt_classWithoutFields(),
otcit_FloatAnalyzer$Result__init_ = $this => {
    jl_Object__init_($this);
},
otcit_FloatAnalyzer$Result__init_0 = () => {
    let var_0 = new otcit_FloatAnalyzer$Result();
    otcit_FloatAnalyzer$Result__init_(var_0);
    return var_0;
};
function oajqs_SamplingOptions() {
    let a = this; jl_Object.call(a);
    a.$shots0 = 0;
    a.$measuredQubits = null;
    a.$maxWork0 = Long_ZERO;
    a.$randomFactory = null;
}
let oajqs_SamplingOptions__init_0 = ($this, $shots) => {
    oajqs_SamplingOptions__init_($this, $shots, null, Long_fromInt(1000000000), oajqs_SamplingOptions$_init_$lambda$_0_0__init_0());
},
oajqs_SamplingOptions__init_1 = var_0 => {
    let var_1 = new oajqs_SamplingOptions();
    oajqs_SamplingOptions__init_0(var_1, var_0);
    return var_1;
},
oajqs_SamplingOptions__init_ = ($this, $shots, $measuredQubits, $maxWork, $randomFactory) => {
    jl_Object__init_($this);
    if ($shots >= 1 && $shots <= 10000) {
        if (Long_lt($maxWork, Long_fromInt(1)))
            $rt_throw(jl_IllegalArgumentException__init_($rt_s(222)));
        $this.$shots0 = $shots;
        $this.$measuredQubits = $measuredQubits !== null ? $measuredQubits.$clone0() : null;
        $this.$maxWork0 = $maxWork;
        $this.$randomFactory = ju_Objects_requireNonNull($randomFactory, $rt_s(223));
        return;
    }
    $rt_throw(jl_IllegalArgumentException__init_($rt_s(224)));
},
oajqs_SamplingOptions__init_2 = (var_0, var_1, var_2, var_3) => {
    let var_4 = new oajqs_SamplingOptions();
    oajqs_SamplingOptions__init_(var_4, var_0, var_1, var_2, var_3);
    return var_4;
},
oajqs_SamplingOptions_shots = $this => {
    return $this.$shots0;
},
oajqs_SamplingOptions_maxWork = $this => {
    return $this.$maxWork0;
},
oajqs_SamplingOptions_indexesFor = ($this, $numQubits) => {
    let $indexes, $i;
    if ($this.$measuredQubits !== null) {
        oajqs_SamplingOptions_validateIndexes($this.$measuredQubits, $numQubits);
        return $this.$measuredQubits.$clone0();
    }
    $indexes = $rt_createIntArray($numQubits);
    $i = 0;
    while ($i < $numQubits) {
        $indexes.data[$i] = $i;
        $i = $i + 1 | 0;
    }
    return $indexes;
},
oajqs_SamplingOptions_newRandom = $this => {
    return ju_Objects_requireNonNull($this.$randomFactory.$get2(), $rt_s(225));
},
oajqs_SamplingOptions_validateIndexes = ($indexes, $numQubits) => {
    let var$3, var$4, $seen, var$6, $index, var$8;
    var$3 = $indexes.data;
    var$4 = var$3.length;
    if (var$4 && var$4 <= $numQubits) {
        $seen = $rt_createBooleanArray($numQubits);
        var$6 = 0;
        a: {
            while (var$6 < var$4) {
                $index = var$3[var$6];
                if ($index < 0)
                    break a;
                if ($index >= $numQubits)
                    break a;
                var$8 = $seen.data;
                if (var$8[$index])
                    break a;
                var$8[$index] = 1;
                var$6 = var$6 + 1 | 0;
            }
            return;
        }
        $rt_throw(jl_IllegalArgumentException__init_($rt_s(226)));
    }
    $rt_throw(jl_IllegalArgumentException__init_($rt_s(227)));
},
oajqs_SamplingOptions_lambda$new$0 = () => {
    return oajqs_SamplingOptions$lambda$new$0$lambda$_12_0__init_0(js_SecureRandom__init_());
};
function jusi_BoxedIntStream$next$lambda$_1_0() {
    jl_Object.call(this);
    this.$_02 = null;
}
let jusi_BoxedIntStream$next$lambda$_1_0__init_ = (var$0, var$1) => {
    jl_Object__init_(var$0);
    var$0.$_02 = var$1;
},
jusi_BoxedIntStream$next$lambda$_1_0__init_0 = var_0 => {
    let var_1 = new jusi_BoxedIntStream$next$lambda$_1_0();
    jusi_BoxedIntStream$next$lambda$_1_0__init_(var_1, var_0);
    return var_1;
},
jusi_BoxedIntStream$next$lambda$_1_0_test = (var$0, var$1) => {
    return var$0.$_02.$test1(jl_Integer_valueOf(var$1));
},
otrr_ClassInfo = $rt_classWithoutFields(otrr_ReflectionInfo),
otrr_ClassInfo_newArrayInstance = (var$0, var$1) => {
    switch (var$0.primitiveKind) {
        default: return $rt_createArray(var$0, var$1);
    }
},
oajqg_PauliX = $rt_classWithoutFields(oajqg_Gate),
oajqg_PauliX__init_ = (var$0, var$1) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_(var$0, 1, oaju_Constants_PAULI_X_MATRIX, $rt_s(12), var$1);
},
oajqg_PauliX__init_0 = var_0 => {
    let var_1 = new oajqg_PauliX();
    oajqg_PauliX__init_(var_1, var_0);
    return var_1;
};
function otrfm_InMemoryVirtualFileSystem() {
    let a = this; jl_Object.call(a);
    a.$root = null;
    a.$userDir = null;
}
let otrfm_InMemoryVirtualFileSystem__init_ = $this => {
    jl_Object__init_($this);
    $this.$root = otrfm_InMemoryVirtualDirectory__init_0($rt_s(125));
    $this.$userDir = $rt_s(156);
},
otrfm_InMemoryVirtualFileSystem__init_0 = () => {
    let var_0 = new otrfm_InMemoryVirtualFileSystem();
    otrfm_InMemoryVirtualFileSystem__init_(var_0);
    return var_0;
},
otrfm_InMemoryVirtualFileSystem_isWindows = $this => {
    return 0;
},
oajqg_PauliY = $rt_classWithoutFields(oajqg_Gate),
oajqg_PauliY__init_ = ($this, $indexes) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 1, oaju_Constants_PAULI_Y_MATRIX, $rt_s(13), $indexes);
},
oajqg_PauliY__init_0 = var_0 => {
    let var_1 = new oajqg_PauliY();
    oajqg_PauliY__init_(var_1, var_0);
    return var_1;
},
oajqg_PauliS = $rt_classWithoutFields(oajqg_Gate),
oajqg_PauliS__init_ = ($this, $indexes) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 1, oaju_Constants_PAULI_S_MATRIX, $rt_s(15), $indexes);
},
oajqg_PauliS__init_0 = var_0 => {
    let var_1 = new oajqg_PauliS();
    oajqg_PauliS__init_(var_1, var_0);
    return var_1;
},
oajqg_PauliT = $rt_classWithoutFields(oajqg_Gate),
oajqg_PauliT__init_ = ($this, $indexes) => {
    oaju_Constants_$callClinit();
    oajqg_Gate__init_($this, 1, oaju_Constants_PAULI_T_MATRIX, $rt_s(16), $indexes);
},
oajqg_PauliT__init_0 = var_0 => {
    let var_1 = new oajqg_PauliT();
    oajqg_PauliT__init_(var_1, var_0);
    return var_1;
};
function oajq_QuantumRegister() {
    let a = this; jl_Object.call(a);
    a.$result = null;
    a.$size0 = 0;
    a.$input = null;
    a.$config = null;
    a.$random0 = null;
    a.$registerState = null;
}
let oajq_QuantumRegister_RANDOM = null,
oajq_QuantumRegister_$callClinit = () => {
    oajq_QuantumRegister_$callClinit = $rt_eraseClinit(oajq_QuantumRegister);
    oajq_QuantumRegister__clinit_();
},
oajq_QuantumRegister__init_0 = ($this, $size, $config) => {
    let var$3;
    oajq_QuantumRegister_$callClinit();
    var$3 = oajq_QuantumRegister_RANDOM;
    ju_Objects_requireNonNull0(var$3);
    oajq_QuantumRegister__init_($this, $size, $config, oajq_QuantumRegister$_init_$lambda$_3_0__init_0(var$3));
},
oajq_QuantumRegister__init_2 = (var_0, var_1) => {
    let var_2 = new oajq_QuantumRegister();
    oajq_QuantumRegister__init_0(var_2, var_0, var_1);
    return var_2;
},
oajq_QuantumRegister__init_ = ($this, $size, $config, $random) => {
    oajq_QuantumRegister_$callClinit();
    jl_Object__init_($this);
    oajq_QuantumRegister_validateSize($size, oaj_JQAPIConfig_maxQubits($config));
    $this.$random0 = ju_Objects_requireNonNull($random, $rt_s(228));
    $this.$result = $rt_createArray(oajq_Qubit, $size);
    $this.$input = $rt_createArray(oajq_Qubit, $size);
    $this.$size0 = $size;
    $this.$config = $config;
    oajq_QuantumRegister_initializeQuantumRegister($this);
},
oajq_QuantumRegister__init_4 = (var_0, var_1, var_2) => {
    let var_3 = new oajq_QuantumRegister();
    oajq_QuantumRegister__init_(var_3, var_0, var_1, var_2);
    return var_3;
},
oajq_QuantumRegister__init_1 = ($this, $size, $config, $initialState, $random) => {
    let $norm, $i, $amplitude;
    oajq_QuantumRegister_$callClinit();
    jl_Object__init_($this);
    oajq_QuantumRegister_validateSize($size, oaj_JQAPIConfig_maxQubits($config));
    ju_Objects_requireNonNull($initialState, $rt_s(229));
    $this.$random0 = ju_Objects_requireNonNull($random, $rt_s(228));
    if ($initialState.$getDimension() != 1 << $size)
        $rt_throw(jl_IllegalArgumentException__init_($rt_s(230)));
    $norm = 0.0;
    $i = 0;
    while ($i < $initialState.$getDimension()) {
        $amplitude = ju_Objects_requireNonNull($initialState.$getEntry($i), $rt_s(231));
        $norm = $norm + oajm_Complex_getReal($amplitude) * oajm_Complex_getReal($amplitude) + oajm_Complex_getImaginary($amplitude) * oajm_Complex_getImaginary($amplitude);
        $i = $i + 1 | 0;
    }
    if ((isFinite($norm) ? 1 : 0) && !(jl_Math_abs1($norm - 1.0) > 1.0E-9)) {
        $this.$size0 = $size;
        $this.$config = $config;
        $this.$result = $rt_createArray(oajq_Qubit, $size);
        $this.$input = null;
        $this.$registerState = oajq_QuantumRegister_toInterleaved($initialState);
        return;
    }
    $rt_throw(jl_IllegalArgumentException__init_($rt_s(232)));
},
oajq_QuantumRegister__init_3 = (var_0, var_1, var_2, var_3) => {
    let var_4 = new oajq_QuantumRegister();
    oajq_QuantumRegister__init_1(var_4, var_0, var_1, var_2, var_3);
    return var_4;
},
oajq_QuantumRegister_nextRandom = $this => {
    let $value;
    $value = $this.$random0.$getAsDouble();
    if ((isFinite($value) ? 1 : 0) && !($value < 0.0) && !($value >= 1.0))
        return $value;
    $rt_throw(jl_IllegalArgumentException__init_($rt_s(233)));
},
oajq_QuantumRegister_validateSize = ($size, $maxQubits) => {
    oajq_QuantumRegister_$callClinit();
    if ($size <= 0)
        $rt_throw(oaje_JQApiLimitException__init_((((jl_StringBuilder__init_()).$append1($rt_s(234))).$append2($size)).$toString()));
    if ($size <= $maxQubits)
        return;
    $rt_throw(oaje_JQApiLimitException__init_(((((((jl_StringBuilder__init_()).$append1($rt_s(235))).$append2($size)).$append1($rt_s(220))).$append2($maxQubits)).$append1($rt_s(132))).$toString()));
},
oajq_QuantumRegister_getRegisterState = $this => {
    return oajq_QuantumRegister_toComplexVector($this);
},
oajq_QuantumRegister_applyOperator = ($this, $operator, $targetQubits) => {
    let var$3, var$4, $parallel;
    a: {
        if (oaj_JQAPIConfig_parallelEnabled($this.$config)) {
            var$3 = $this.$registerState.data.length / 2 | 0;
            var$4 = $this.$config;
            if (var$3 >= oaj_JQAPIConfig_parallelThreshold(var$4)) {
                $parallel = 1;
                break a;
            }
        }
        $parallel = 0;
    }
    $this.$applyOperator0($operator, $targetQubits, $parallel);
},
oajq_QuantumRegister_applyOperator0 = ($this, $operator, $targetQubits, $parallel) => {
    let $k, $targetMask, var$6, $localDimension, $dimension, $offsets, $t, $offset, $j, var$13, $opRe, $opIm, $opNonZero, $r, $c, $entry, $flat, var$21, var$22, var$23, $base, var$25, $target, $bit;
    ju_Objects_requireNonNull($operator, $rt_s(236));
    ju_Objects_requireNonNull($targetQubits, $rt_s(237));
    $k = $targetQubits.$size();
    if ($k > $this.$size0)
        $rt_throw(jl_IllegalArgumentException__init_($rt_s(238)));
    $targetMask = 0;
    var$6 = $targetQubits.$iterator();
    a: {
        while (true) {
            if (!var$6.$hasNext()) {
                $localDimension = 1 << $k;
                if ($operator.$getRowDimension() == $localDimension && $operator.$getColumnDimension() == $localDimension) {
                    $dimension = $this.$registerState.data.length / 2 | 0;
                    $offsets = $rt_createIntArray($localDimension);
                    $t = 0;
                    while ($t < $localDimension) {
                        $offset = 0;
                        $j = 0;
                        while ($j < $k) {
                            if ($t >> (($k - 1 | 0) - $j | 0) & 1)
                                $offset = $offset | 1 << (($this.$size0 - 1 | 0) - ($targetQubits.$get($j)).$intValue() | 0);
                            $j = $j + 1 | 0;
                        }
                        $offsets.data[$t] = $offset;
                        $t = $t + 1 | 0;
                    }
                    var$13 = $rt_imul($localDimension, $localDimension);
                    $opRe = $rt_createDoubleArray(var$13);
                    $opIm = $rt_createDoubleArray(var$13);
                    $opNonZero = $rt_createBooleanArray(var$13);
                    $r = 0;
                    while ($r < $localDimension) {
                        $c = 0;
                        while ($c < $localDimension) {
                            $entry = $operator.$getEntry0($r, $c);
                            $flat = $rt_imul($r, $localDimension) + $c | 0;
                            oajm_Complex_$callClinit();
                            var$13 = oajm_Complex_equals($entry, oajm_Complex_ZERO) ? 0 : 1;
                            var$21 = $opNonZero.data;
                            var$22 = $opRe.data;
                            var$23 = $opIm.data;
                            var$21[$flat] = var$13;
                            var$22[$flat] = oajm_Complex_getReal($entry);
                            var$23[$flat] = oajm_Complex_getImaginary($entry);
                            $c = $c + 1 | 0;
                        }
                        $r = $r + 1 | 0;
                    }
                    b: {
                        if ($parallel)
                            (oaj_JQAPIConfig_operatorExecutor($this.$config)).$applyGroups($dimension, $targetMask, oajq_QuantumRegister$applyOperator$lambda$_18_0__init_0($this, $localDimension, $offsets, $opRe, $opIm, $opNonZero));
                        else {
                            $base = 0;
                            while (true) {
                                if ($base >= $dimension)
                                    break b;
                                if (!($base & $targetMask))
                                    oajq_QuantumRegister_applyOperatorGroup($this, $base, $localDimension, $offsets, $opRe, $opIm, $opNonZero);
                                $base = $base + 1 | 0;
                            }
                        }
                    }
                    return;
                }
                var$25 = new jl_IllegalArgumentException;
                var$6 = (((jl_StringBuilder__init_()).$append1($rt_s(239))).$append2($operator.$getRowDimension())).$append1($rt_s(95));
                jl_IllegalArgumentException__init_1(var$25, ((((var$6.$append2($operator.$getColumnDimension())).$append1($rt_s(240))).$append2($k)).$append1($rt_s(241))).$toString());
                $rt_throw(var$25);
            }
            $target = var$6.$next();
            ju_Objects_requireNonNull($target, $rt_s(242));
            if ($target.$intValue() < 0)
                break a;
            if ($target.$intValue() >= $this.$size0)
                break a;
            $bit = 1 << (($this.$size0 - 1 | 0) - $target.$intValue() | 0);
            if ($targetMask & $bit)
                break;
            $targetMask = $targetMask | $bit;
        }
        $rt_throw(jl_IllegalArgumentException__init_((((jl_StringBuilder__init_()).$append1($rt_s(243))).$append($target)).$toString()));
    }
    $rt_throw(oaje_JQApiLimitException__init_((((((jl_StringBuilder__init_()).$append1($rt_s(244))).$append2($this.$size0)).$append1($rt_s(79))).$append($target)).$toString()));
},
oajq_QuantumRegister_applyOperatorGroup = ($this, $base, $localDimension, $offsets, $opRe, $opIm, $opNonZero) => {
    let $localRe, $localIm, $t, var$10, var$11, $amplitudeIndex, var$13, var$14, $r, $sumRe, $sumIm, $c, $flat, var$20;
    $localRe = $rt_createDoubleArray($localDimension);
    $localIm = $rt_createDoubleArray($localDimension);
    $t = 0;
    while ($t < $localDimension) {
        var$10 = $localIm.data;
        var$11 = $localRe.data;
        $amplitudeIndex = $base | $offsets.data[$t];
        var$13 = $this.$registerState.data;
        var$14 = 2 * $amplitudeIndex | 0;
        var$11[$t] = var$13[var$14];
        var$10[$t] = $this.$registerState.data[var$14 + 1 | 0];
        $t = $t + 1 | 0;
    }
    $r = 0;
    while ($r < $localDimension) {
        $sumRe = 0.0;
        $sumIm = 0.0;
        $c = 0;
        while ($c < $localDimension) {
            var$11 = $opNonZero.data;
            $flat = $rt_imul($r, $localDimension) + $c | 0;
            if (var$11[$flat]) {
                var$20 = $localIm.data;
                var$13 = $opIm.data;
                var$10 = $localRe.data;
                var$11 = $opRe.data;
                $sumRe = $sumRe + var$11[$flat] * var$10[$c] - var$13[$flat] * var$20[$c];
                $sumIm = $sumIm + var$11[$flat] * var$20[$c] + var$13[$flat] * var$10[$c];
            }
            $c = $c + 1 | 0;
        }
        $amplitudeIndex = $base | $offsets.data[$r];
        var$11 = $this.$registerState.data;
        var$14 = 2 * $amplitudeIndex | 0;
        var$11[var$14] = $sumRe;
        $this.$registerState.data[var$14 + 1 | 0] = $sumIm;
        $r = $r + 1 | 0;
    }
},
oajq_QuantumRegister_measure = $this => {
    let $indexCollapsed, $i, $bit, var$4, var$5;
    $indexCollapsed = oajq_QuantumRegister_calculateCollapsedIndex0($this);
    ju_Arrays_fill2($this.$registerState, 0.0);
    $this.$registerState.data[2 * $indexCollapsed | 0] = 1.0;
    $i = 0;
    while ($i < $this.$size0) {
        $bit = $indexCollapsed >> (($this.$size0 - 1 | 0) - $i | 0) & 1;
        var$4 = $this.$result;
        var$5 = $bit ? oajq_QubitOne__init_() : oajq_QubitZero__init_();
        var$4.data[$i] = var$5;
        $i = $i + 1 | 0;
    }
},
oajq_QuantumRegister_measureQubitAtIndexes = ($this, $indexes) => {
    ju_Objects_requireNonNull0($indexes);
    $indexes.$forEach(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0__init_0($this));
    if ($indexes.$size() >= $this.$size0)
        $this.$measure();
    else
        $indexes.$forEach(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1__init_0($this));
},
oajq_QuantumRegister_reset = ($this, $qubitIndex) => {
    let $collapsedValue;
    if ($qubitIndex >= 0 && $qubitIndex < $this.$size0) {
        $collapsedValue = oajq_QuantumRegister_calculateCollapsedIndex($this, $qubitIndex);
        oajq_QuantumRegister_updateRegisterStateAfterQubitCollapsed($this, $qubitIndex, $collapsedValue);
        if ($collapsedValue == 1) {
            oaju_Constants_$callClinit();
            $this.$applyOperator(oaju_Constants_PAULI_X_MATRIX, ju_List_of(jl_Integer_valueOf($qubitIndex)));
        }
        return;
    }
    $rt_throw(oaje_JQApiLimitException__init_(((((((jl_StringBuilder__init_()).$append1($rt_s(245))).$append2($qubitIndex)).$append1($rt_s(246))).$append2($this.$size0)).$append1($rt_s(132))).$toString()));
},
oajq_QuantumRegister_resetQubitAtIndexes = ($this, $indexes) => {
    ju_Objects_requireNonNull0($indexes);
    $indexes.$forEach(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0__init_0($this));
    $indexes.$forEach(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1__init_0($this));
},
oajq_QuantumRegister_getResult = $this => {
    return $this.$result;
},
oajq_QuantumRegister_initializeQuantumRegister = $this => {
    let $registerStateToUpdate, $i;
    $registerStateToUpdate = (oajq_QubitZero__init_()).$getValue0();
    $this.$input.data[0] = oajq_QubitZero__init_();
    $i = 1;
    while ($i < $this.$size0) {
        $registerStateToUpdate = ((oajq_QubitZero__init_()).$getValue0()).$tensorProduct($registerStateToUpdate);
        $this.$input.data[$i] = oajq_QubitZero__init_();
        $i = $i + 1 | 0;
    }
    $this.$registerState = oajq_QuantumRegister_toInterleaved($registerStateToUpdate);
},
oajq_QuantumRegister_calculateCollapsedIndex0 = $this => {
    let $random, $lastIndex, $j, var$4, var$5, $re, $im;
    $random = oajq_QuantumRegister_nextRandom($this);
    $lastIndex = ($this.$registerState.data.length / 2 | 0) - 1 | 0;
    $j = (-1);
    while ($random >= 0.0 && $j < $lastIndex) {
        $j = $j + 1 | 0;
        var$4 = $this.$registerState.data;
        var$5 = 2 * $j | 0;
        $re = var$4[var$5];
        $im = $this.$registerState.data[var$5 + 1 | 0];
        $random = $random - ($re * $re + $im * $im);
    }
    return $j;
},
oajq_QuantumRegister_calculateCollapsedIndex = ($this, $qubitIndex) => {
    let $random, $zeroProbability, $dimension, $shift, $i, $bitAtIndex, var$8, var$9, $re, $im, $probability;
    $random = oajq_QuantumRegister_nextRandom($this);
    $zeroProbability = 0.0;
    $dimension = $this.$registerState.data.length / 2 | 0;
    $shift = ($this.$size0 - 1 | 0) - $qubitIndex | 0;
    $i = 0;
    while ($i < $dimension) {
        $bitAtIndex = $i >> $shift & 1;
        var$8 = $this.$registerState.data;
        var$9 = 2 * $i | 0;
        $re = var$8[var$9];
        $im = $this.$registerState.data[var$9 + 1 | 0];
        $probability = $re * $re + $im * $im;
        if ($bitAtIndex)
            $probability = 0.0;
        $zeroProbability = $zeroProbability + $probability;
        $i = $i + 1 | 0;
    }
    return !($random < $zeroProbability) ? 1 : 0;
},
oajq_QuantumRegister_updateRegisterStateAfterQubitCollapsed = ($this, $qubitPos, $collapsedValue) => {
    let $dimension, $shift, $branchProbability, $i, var$7, var$8, $re, $im, $norm;
    $dimension = $this.$registerState.data.length / 2 | 0;
    $shift = ($this.$size0 - 1 | 0) - $qubitPos | 0;
    $branchProbability = 0.0;
    $i = 0;
    while ($i < $dimension) {
        if (($i >> $shift & 1) == $collapsedValue) {
            var$7 = $this.$registerState.data;
            var$8 = 2 * $i | 0;
            $re = var$7[var$8];
            $im = $this.$registerState.data[var$8 + 1 | 0];
            $branchProbability = $branchProbability + $re * $re + $im * $im;
        }
        $i = $i + 1 | 0;
    }
    if ($branchProbability === 0.0)
        $rt_throw(jl_IllegalStateException__init_0(((((jl_StringBuilder__init_()).$append1($rt_s(247))).$append2($qubitPos)).$append1($rt_s(248))).$toString()));
    $norm = jl_Math_sqrt($branchProbability);
    $i = 0;
    while ($i < $dimension) {
        if (($i >> $shift & 1) != $collapsedValue) {
            var$7 = $this.$registerState.data;
            var$8 = 2 * $i | 0;
            var$7[var$8] = 0.0;
            $this.$registerState.data[var$8 + 1 | 0] = 0.0;
        } else {
            var$7 = $this.$registerState.data;
            var$8 = 2 * $i | 0;
            var$7[var$8] = var$7[var$8] / $norm;
            var$7 = $this.$registerState.data;
            var$8 = var$8 + 1 | 0;
            var$7[var$8] = var$7[var$8] / $norm;
        }
        $i = $i + 1 | 0;
    }
},
oajq_QuantumRegister_toInterleaved = $vector => {
    let $data, var$3, var$4, $interleaved, $i, var$7, var$8;
    oajq_QuantumRegister_$callClinit();
    $data = $vector.$getData0();
    var$3 = $data.data;
    var$4 = var$3.length;
    $interleaved = $rt_createDoubleArray(var$4 * 2 | 0);
    $i = 0;
    while ($i < var$4) {
        var$7 = $interleaved.data;
        var$8 = 2 * $i | 0;
        var$7[var$8] = oajm_Complex_getReal(var$3[$i]);
        var$7[var$8 + 1 | 0] = oajm_Complex_getImaginary(var$3[$i]);
        $i = $i + 1 | 0;
    }
    return $interleaved;
},
oajq_QuantumRegister_toComplexVector = $this => {
    let $dimension, $data, $i, var$4, var$5, $re, $im;
    $dimension = $this.$registerState.data.length / 2 | 0;
    $data = $rt_createArray(oajm_Complex, $dimension);
    $i = 0;
    while ($i < $dimension) {
        var$4 = $this.$registerState.data;
        var$5 = 2 * $i | 0;
        $re = var$4[var$5];
        $im = $this.$registerState.data[var$5 + 1 | 0];
        if ($re === 0.0 && $im === 0.0) {
            var$4 = $data.data;
            oajm_Complex_$callClinit();
            var$4[$i] = oajm_Complex_ZERO;
        } else if ($re === 1.0 && $im === 0.0) {
            var$4 = $data.data;
            oajm_Complex_$callClinit();
            var$4[$i] = oajm_Complex_ONE;
        } else
            $data.data[$i] = oajm_Complex__init_($re, $im);
        $i = $i + 1 | 0;
    }
    return oajm_ComplexVector__init_2($data);
},
oajq_QuantumRegister_lambda$resetQubitAtIndexes$0 = ($this, $index) => {
    if ($index !== null && $index.$intValue() >= 0 && $index.$intValue() < $this.$size0)
        return;
    $rt_throw(oaje_JQApiLimitException__init_(((((((jl_StringBuilder__init_()).$append1($rt_s(245))).$append($index)).$append1($rt_s(246))).$append2($this.$size0)).$append1($rt_s(132))).$toString()));
},
oajq_QuantumRegister_lambda$measureQubitAtIndexes$1 = ($this, $index) => {
    let $collapsedValue, var$3, var$4, var$5;
    $collapsedValue = oajq_QuantumRegister_calculateCollapsedIndex($this, $index.$intValue());
    var$3 = $this.$result;
    var$4 = $index.$intValue();
    var$5 = $collapsedValue ? oajq_QubitOne__init_() : oajq_QubitZero__init_();
    var$3.data[var$4] = var$5;
    oajq_QuantumRegister_updateRegisterStateAfterQubitCollapsed($this, $index.$intValue(), $collapsedValue);
},
oajq_QuantumRegister_lambda$measureQubitAtIndexes$0 = ($this, $index) => {
    if ($index !== null && $index.$intValue() >= 0 && $index.$intValue() < $this.$size0)
        return;
    $rt_throw(oaje_JQApiLimitException__init_(((((((jl_StringBuilder__init_()).$append1($rt_s(249))).$append($index)).$append1($rt_s(246))).$append2($this.$size0)).$append1($rt_s(132))).$toString()));
},
oajq_QuantumRegister_lambda$applyOperator$0 = ($this, $fLocalDimension, $fOffsets, $fOpRe, $fOpIm, $fOpNonZero, $base) => {
    oajq_QuantumRegister_applyOperatorGroup($this, $base, $fLocalDimension, $fOffsets, $fOpRe, $fOpIm, $fOpNonZero);
},
oajq_QuantumRegister__clinit_ = () => {
    oajq_QuantumRegister_RANDOM = js_SecureRandom__init_();
};
function ju_Arrays$ArrayAsList() {
    ju_AbstractList.call(this);
    this.$array1 = null;
}
let ju_Arrays$ArrayAsList__init_ = ($this, $array) => {
    ju_AbstractList__init_($this);
    $this.$array1 = $array;
},
ju_Arrays$ArrayAsList__init_0 = var_0 => {
    let var_1 = new ju_Arrays$ArrayAsList();
    ju_Arrays$ArrayAsList__init_(var_1, var_0);
    return var_1;
},
ju_Arrays$ArrayAsList_get = ($this, $index) => {
    return $this.$array1.data[$index];
},
ju_Arrays$ArrayAsList_size = $this => {
    return $this.$array1.data.length;
},
ju_Collections = $rt_classWithoutFields(),
ju_Collections_EMPTY_SET = null,
ju_Collections_EMPTY_MAP = null,
ju_Collections_EMPTY_LIST = null,
ju_Collections_EMPTY_ITERATOR = null,
ju_Collections_EMPTY_LIST_ITERATOR = null,
ju_Collections_reverseOrder = null,
ju_Collections_$callClinit = () => {
    ju_Collections_$callClinit = $rt_eraseClinit(ju_Collections);
    ju_Collections__clinit_();
},
ju_Collections_emptyIterator = () => {
    ju_Collections_$callClinit();
    return ju_Collections_EMPTY_ITERATOR;
},
ju_Collections_emptySet = () => {
    ju_Collections_$callClinit();
    return ju_Collections_EMPTY_SET;
},
ju_Collections_emptyMap = () => {
    ju_Collections_$callClinit();
    return ju_Collections_EMPTY_MAP;
},
ju_Collections_singletonList = $o => {
    ju_Collections_$callClinit();
    return ju_TemplateCollections$SingleElementList__init_0($o);
},
ju_Collections__clinit_ = () => {
    ju_Collections_EMPTY_SET = ju_Collections$1__init_0();
    ju_Collections_EMPTY_MAP = ju_Collections$2__init_0();
    ju_Collections_EMPTY_LIST = ju_Collections$3__init_0();
    ju_Collections_EMPTY_ITERATOR = ju_Collections$4__init_0();
    ju_Collections_EMPTY_LIST_ITERATOR = ju_Collections$5__init_0();
    ju_Collections_reverseOrder = ju_Collections$_clinit_$lambda$_59_0__init_0();
};
$rt_packages([-1, "java", 0, "security", 0, "util", 2, "stream", 3, "impl", 0, "math", 0, "lang", -1, "org", 7, "aitan", 8, "jqapi", 9, "visualization", 10, "spec", 9, "quantum", 12, "gates", 12, "simulator", 9, "math"
]);
$rt_metadata([jl_Object, "Object", 6, 0, [], 1, 0, 0, ["$isEmptyMonitor", $rt_wrapFunction0(jl_Object_isEmptyMonitor), "$getClass", $rt_wrapFunction0(jl_Object_getClass), "$hashCode1", $rt_wrapFunction0(jl_Object_hashCode), "$equals0", $rt_wrapFunction1(jl_Object_equals), "$toString", $rt_wrapFunction0(jl_Object_toString), "$identity", $rt_wrapFunction0(jl_Object_identity), "$clone0", $rt_wrapFunction0(jl_Object_clone)],
oajqg_Gate, 0, jl_Object, [], 1025, 0, 0, ["$_init_3", $rt_wrapFunction4(oajqg_Gate__init_), "$getMatrix", $rt_wrapFunction0(oajqg_Gate_getMatrix), "$getIndexes", $rt_wrapFunction0(oajqg_Gate_getIndexes), "$getType", $rt_wrapFunction0(oajqg_Gate_getType), "$getNumberQubits", $rt_wrapFunction0(oajqg_Gate_getNumberQubits)],
oajqg_MultiControlled, "MultiControlled", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_11", $rt_wrapFunction3(oajqg_MultiControlled__init_)],
jl_Throwable, 0, jl_Object, [], 1, 0, 0, ["$fillInStackTrace", $rt_wrapFunction0(jl_Throwable_fillInStackTrace), "$getMessage", $rt_wrapFunction0(jl_Throwable_getMessage), "$getCause", $rt_wrapFunction0(jl_Throwable_getCause)],
jl_Exception, 0, jl_Throwable, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_Exception__init_), "$_init_4", $rt_wrapFunction2(jl_Exception__init_1), "$_init_", $rt_wrapFunction1(jl_Exception__init_0)],
jl_RuntimeException, 0, jl_Exception, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_RuntimeException__init_), "$_init_4", $rt_wrapFunction2(jl_RuntimeException__init_1), "$_init_", $rt_wrapFunction1(jl_RuntimeException__init_0)],
jl_IndexOutOfBoundsException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_IndexOutOfBoundsException__init_0)],
ju_Enumeration, 0, jl_Object, [], 1537, 0, 0, 0,
juf_Consumer, 0, jl_Object, [], 1537, 0, 0, 0,
oajq_Circuit$initializeLevels$lambda$_8_2, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_71", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_2__init_), "$accept0", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_2_accept0), "$accept", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_2_accept)],
jl_Record, 0, jl_Object, [], 1025, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_Record__init_)],
oajv_CircuitSpecs, 0, jl_Object, [], 17, 0, () => oajv_CircuitSpecs_$callClinit(), 0,
oajqg_Rz, "Rz", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_7", $rt_wrapFunction2(oajqg_Rz__init_)],
ji_Serializable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Number, 0, jl_Object, [ji_Serializable], 1025, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_Number__init_)],
jl_Comparable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Integer, "Integer", 6, jl_Number, [jl_Comparable], 1, 0, () => jl_Integer_$callClinit(), ["$_init_15", $rt_wrapFunction1(jl_Integer__init_), "$intValue", $rt_wrapFunction0(jl_Integer_intValue), "$toString", $rt_wrapFunction0(jl_Integer_toString1), "$hashCode1", $rt_wrapFunction0(jl_Integer_hashCode), "$equals0", $rt_wrapFunction1(jl_Integer_equals)],
oajqg_Ry, "Ry", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_7", $rt_wrapFunction2(oajqg_Ry__init_)],
oajvs_GateSpec, "GateSpec", 11, jl_Record, [], 17, 0, 0, ["$_init_53", function(var_1, var_2, var_3, var_4, var_5) { oajvs_GateSpec__init_(this, var_1, var_2, var_3, var_4, var_5); }, "$toString", $rt_wrapFunction0(oajvs_GateSpec_toString), "$hashCode1", $rt_wrapFunction0(oajvs_GateSpec_hashCode), "$equals0", $rt_wrapFunction1(oajvs_GateSpec_equals), "$kind", $rt_wrapFunction0(oajvs_GateSpec_kind), "$targets", $rt_wrapFunction0(oajvs_GateSpec_targets), "$controls", $rt_wrapFunction0(oajvs_GateSpec_controls),
"$params", $rt_wrapFunction0(oajvs_GateSpec_params), "$matrix", $rt_wrapFunction0(oajvs_GateSpec_matrix)],
oajqg_Rx, "Rx", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_7", $rt_wrapFunction2(oajqg_Rx__init_)],
jl_CloneNotSupportedException, 0, jl_Exception, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_CloneNotSupportedException__init_)],
juf_IntPredicate, 0, jl_Object, [], 1537, 0, 0, 0,
oajq_Circuit$initializeLevels$lambda$_8_1, 0, jl_Object, [juf_IntPredicate], 1, 0, 0, ["$_init_71", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_1__init_), "$test2", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_1_test)],
juf_Predicate, 0, jl_Object, [], 1537, 0, 0, 0,
oajq_Circuit$initializeLevels$lambda$_8_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_67", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_0__init_), "$test1", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_0_test0), "$test", $rt_wrapFunction1(oajq_Circuit$initializeLevels$lambda$_8_0_test)],
oaju_Constants, 0, jl_Object, [], 1, 0, () => oaju_Constants_$callClinit(), 0,
jl_AbstractStringBuilder$Constants, 0, jl_Object, [], 0, 0, () => jl_AbstractStringBuilder$Constants_$callClinit(), 0,
jm_BigDecimal$1, 0, jl_Object, [], 32768, 0, () => jm_BigDecimal$1_$callClinit(), 0,
jl_Long, 0, jl_Number, [jl_Comparable], 1, 0, () => jl_Long_$callClinit(), 0,
juf_Supplier, 0, jl_Object, [], 1537, 0, 0, 0,
jus_Collectors$toList$lambda$_2_0, 0, jl_Object, [juf_Supplier], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jus_Collectors$toList$lambda$_2_0__init_), "$get2", $rt_wrapFunction0(jus_Collectors$toList$lambda$_2_0_get0), "$get1", $rt_wrapFunction0(jus_Collectors$toList$lambda$_2_0_get)],
ju_Map, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Runnable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Thread, 0, jl_Object, [jl_Runnable], 1, 0, () => jl_Thread_$callClinit(), ["$_init_", $rt_wrapFunction1(jl_Thread__init_0), "$_init_19", $rt_wrapFunction2(jl_Thread__init_)],
oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_67", $rt_wrapFunction1(oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0__init_), "$test1", $rt_wrapFunction1(oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0_test0), "$test0", $rt_wrapFunction1(oajq_Circuit$lambda$initializeLevels$0$lambda$_12_0_test)],
jm_BigInteger, 0, jl_Number, [jl_Comparable, ji_Serializable], 1, 0, () => jm_BigInteger_$callClinit(), ["$_init_", $rt_wrapFunction1(jm_BigInteger__init_4), "$_init_20", $rt_wrapFunction2(jm_BigInteger__init_1), "$_init_23", $rt_wrapFunction2(jm_BigInteger__init_3), "$_init_22", $rt_wrapFunction3(jm_BigInteger__init_5), "$_init_21", $rt_wrapFunction2(jm_BigInteger__init_2), "$_init_65", $rt_wrapFunction2(jm_BigInteger__init_7), "$abs1", $rt_wrapFunction0(jm_BigInteger_abs), "$negate", $rt_wrapFunction0(jm_BigInteger_negate),
"$add3", $rt_wrapFunction1(jm_BigInteger_add), "$subtract0", $rt_wrapFunction1(jm_BigInteger_subtract), "$signum", $rt_wrapFunction0(jm_BigInteger_signum), "$shiftRight0", $rt_wrapFunction1(jm_BigInteger_shiftRight), "$shiftLeft0", $rt_wrapFunction1(jm_BigInteger_shiftLeft), "$shiftLeftOneBit0", $rt_wrapFunction0(jm_BigInteger_shiftLeftOneBit), "$bitLength2", $rt_wrapFunction0(jm_BigInteger_bitLength), "$testBit", $rt_wrapFunction1(jm_BigInteger_testBit), "$getLowestSetBit", $rt_wrapFunction0(jm_BigInteger_getLowestSetBit),
"$longValue", $rt_wrapFunction0(jm_BigInteger_longValue), "$compareTo", $rt_wrapFunction1(jm_BigInteger_compareTo), "$equals0", $rt_wrapFunction1(jm_BigInteger_equals), "$equalsArrays", $rt_wrapFunction1(jm_BigInteger_equalsArrays), "$multiply1", $rt_wrapFunction1(jm_BigInteger_multiply), "$pow1", $rt_wrapFunction1(jm_BigInteger_pow), "$divideAndRemainder", $rt_wrapFunction1(jm_BigInteger_divideAndRemainder), "$cutOffLeadingZeroes", $rt_wrapFunction0(jm_BigInteger_cutOffLeadingZeroes), "$getFirstNonzeroDigit",
$rt_wrapFunction0(jm_BigInteger_getFirstNonzeroDigit)],
jl_ArithmeticException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_", $rt_wrapFunction1(jl_ArithmeticException__init_0)],
jl_AutoCloseable, 0, jl_Object, [], 1537, 0, 0, 0,
jus_BaseStream, 0, jl_Object, [jl_AutoCloseable], 1537, 0, 0, 0,
jus_IntStream, 0, jl_Object, [jus_BaseStream], 1537, 0, 0, 0,
jusi_SimpleIntStreamImpl, 0, jl_Object, [jus_IntStream], 1025, 0, 0, ["$_init_0", $rt_wrapFunction0(jusi_SimpleIntStreamImpl__init_), "$filter", $rt_wrapFunction1(jusi_SimpleIntStreamImpl_filter), "$boxed", $rt_wrapFunction0(jusi_SimpleIntStreamImpl_boxed)],
jus_Collector, 0, jl_Object, [], 1537, 0, 0, 0,
jusi_SimpleStreamImpl$collect$lambda$_26_0, "SimpleStreamImpl$collect$lambda$_26_0", 4, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_39", $rt_wrapFunction2(jusi_SimpleStreamImpl$collect$lambda$_26_0__init_), "$test1", $rt_wrapFunction1(jusi_SimpleStreamImpl$collect$lambda$_26_0_test)],
jl_Iterable, 0, jl_Object, [], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach)],
ju_Collection, 0, jl_Object, [jl_Iterable], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream)],
ju_AbstractCollection, 0, jl_Object, [ju_Collection], 1025, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_AbstractCollection__init_), "$isEmpty", $rt_wrapFunction0(ju_AbstractCollection_isEmpty), "$contains", $rt_wrapFunction1(ju_AbstractCollection_contains), "$toArray", $rt_wrapFunction1(ju_AbstractCollection_toArray), "$addAll", $rt_wrapFunction1(ju_AbstractCollection_addAll),
"$toString", $rt_wrapFunction0(ju_AbstractCollection_toString)],
ju_Set, 0, jl_Object, [ju_Collection], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream)],
ju_AbstractSet, 0, ju_AbstractCollection, [ju_Set], 1025, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_AbstractSet__init_), "$equals0", $rt_wrapFunction1(ju_AbstractSet_equals), "$hashCode1", $rt_wrapFunction0(ju_AbstractSet_hashCode)],
jl_Cloneable, 0, jl_Object, [], 1537, 0, 0, 0,
ju_EnumSet, 0, ju_AbstractSet, [jl_Cloneable, ji_Serializable], 1025, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_EnumSet__init_)]]);
$rt_metadata([oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_15", $rt_wrapFunction1(oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0__init_), "$test1", $rt_wrapFunction1(oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0_test0), "$test", $rt_wrapFunction1(oajq_Circuit$lambda$initializeLevels$2$lambda$_10_0_test)],
oajq_Qubit, 0, jl_Object, [], 1025, 0, 0, ["$_init_30", $rt_wrapFunction1(oajq_Qubit__init_), "$getValue0", $rt_wrapFunction0(oajq_Qubit_getValue), "$equals0", $rt_wrapFunction1(oajq_Qubit_equals)],
oajq_QubitZero, 0, oajq_Qubit, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(oajq_QubitZero__init_0)],
jl_CharSequence, 0, jl_Object, [], 1537, 0, 0, 0,
ju_SequencedMap, 0, jl_Object, [ju_Map], 1537, 0, 0, 0,
jl_StringIndexOutOfBoundsException, 0, jl_IndexOutOfBoundsException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_StringIndexOutOfBoundsException__init_0)],
oajqs_QuantumSimulator, 0, jl_Object, [], 1537, 0, 0, 0,
oajqs_LocalSimulator, 0, jl_Object, [oajqs_QuantumSimulator], 1, 0, 0, ["$_init_49", $rt_wrapFunction2(oajqs_LocalSimulator__init_), "$_init_48", $rt_wrapFunction3(oajqs_LocalSimulator__init_1), "$_init_67", $rt_wrapFunction1(oajqs_LocalSimulator__init_0), "$execute0", $rt_wrapFunction0(oajqs_LocalSimulator_execute), "$getQuantumRegister", $rt_wrapFunction0(oajqs_LocalSimulator_getQuantumRegister)],
jus_Stream, 0, jl_Object, [jus_BaseStream], 1537, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList)],
jusi_SimpleStreamImpl, 0, jl_Object, [jus_Stream], 1025, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList), "$_init_0", $rt_wrapFunction0(jusi_SimpleStreamImpl__init_), "$map", $rt_wrapFunction1(jusi_SimpleStreamImpl_map), "$flatMap", $rt_wrapFunction1(jusi_SimpleStreamImpl_flatMap), "$distinct", $rt_wrapFunction0(jusi_SimpleStreamImpl_distinct), "$toArray0", $rt_wrapFunction0(jusi_SimpleStreamImpl_toArray0), "$toArray1", $rt_wrapFunction1(jusi_SimpleStreamImpl_toArray), "$collect", $rt_wrapFunction1(jusi_SimpleStreamImpl_collect),
"$count", $rt_wrapFunction0(jusi_SimpleStreamImpl_count), "$anyMatch", $rt_wrapFunction1(jusi_SimpleStreamImpl_anyMatch), "$allMatch", $rt_wrapFunction1(jusi_SimpleStreamImpl_allMatch), "$iterator", $rt_wrapFunction0(jusi_SimpleStreamImpl_iterator), "$close", $rt_wrapFunction0(jusi_SimpleStreamImpl_close)],
jusi_WrappingStreamImpl, 0, jusi_SimpleStreamImpl, [], 1025, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList), "$_init_37", $rt_wrapFunction1(jusi_WrappingStreamImpl__init_), "$next0", $rt_wrapFunction1(jusi_WrappingStreamImpl_next), "$estimateSize", $rt_wrapFunction0(jusi_WrappingStreamImpl_estimateSize)],
jusi_DistinctStreamImpl, 0, jusi_WrappingStreamImpl, [], 1, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList), "$_init_37", $rt_wrapFunction1(jusi_DistinctStreamImpl__init_), "$wrap", $rt_wrapFunction1(jusi_DistinctStreamImpl_wrap)],
oajqg_Measurement, "Measurement", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_Measurement__init_)],
otci_Base46, 0, jl_Object, [], 17, 0, 0, 0,
oajq_CircuitLevel, "CircuitLevel", 12, jl_Object, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(oajq_CircuitLevel__init_), "$addGate", $rt_wrapFunction1(oajq_CircuitLevel_addGate0), "$addGate0", $rt_wrapFunction2(oajq_CircuitLevel_addGate), "$getGates", $rt_wrapFunction0(oajq_CircuitLevel_getGates)],
ju_GenericEnumSet, 0, ju_EnumSet, [], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_28", $rt_wrapFunction1(ju_GenericEnumSet__init_), "$add2", $rt_wrapFunction1(ju_GenericEnumSet_add), "$addAll", $rt_wrapFunction1(ju_GenericEnumSet_addAll), "$add", $rt_wrapFunction1(ju_GenericEnumSet_add0)],
oajqg_GenericGate, "GenericGate", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_11", $rt_wrapFunction3(oajqg_GenericGate__init_)],
oajqs_LocalSimulator$execute$lambda$_5_0, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_33", $rt_wrapFunction1(oajqs_LocalSimulator$execute$lambda$_5_0__init_), "$accept0", $rt_wrapFunction1(oajqs_LocalSimulator$execute$lambda$_5_0_accept0), "$accept2", $rt_wrapFunction1(oajqs_LocalSimulator$execute$lambda$_5_0_accept)],
ju_Comparator, 0, jl_Object, [], 1537, 0, 0, 0,
jl_String$_clinit_$lambda$_118_0, 0, jl_Object, [ju_Comparator], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_String$_clinit_$lambda$_118_0__init_)],
jl_AbstractStringBuilder, 0, jl_Object, [ji_Serializable, jl_CharSequence], 0, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_AbstractStringBuilder__init_0), "$_init_15", $rt_wrapFunction1(jl_AbstractStringBuilder__init_), "$_init_", $rt_wrapFunction1(jl_AbstractStringBuilder__init_2), "$_init_42", $rt_wrapFunction1(jl_AbstractStringBuilder__init_1), "$append4", $rt_wrapFunction1(jl_AbstractStringBuilder_append3), "$append5", $rt_wrapFunction1(jl_AbstractStringBuilder_append), "$insert0", $rt_wrapFunction2(jl_AbstractStringBuilder_insert1),
"$append6", $rt_wrapFunction1(jl_AbstractStringBuilder_append0), "$append3", $rt_wrapFunction2(jl_AbstractStringBuilder_append5), "$insert1", $rt_wrapFunction3(jl_AbstractStringBuilder_insert4), "$append7", $rt_wrapFunction1(jl_AbstractStringBuilder_append1), "$insert2", $rt_wrapFunction2(jl_AbstractStringBuilder_insert0), "$append8", $rt_wrapFunction1(jl_AbstractStringBuilder_append4), "$insert3", $rt_wrapFunction2(jl_AbstractStringBuilder_insert3), "$insert", $rt_wrapFunction2(jl_AbstractStringBuilder_insert2),
"$ensureCapacity", $rt_wrapFunction1(jl_AbstractStringBuilder_ensureCapacity), "$toString", $rt_wrapFunction0(jl_AbstractStringBuilder_toString), "$length", $rt_wrapFunction0(jl_AbstractStringBuilder_length), "$charAt", $rt_wrapFunction1(jl_AbstractStringBuilder_charAt), "$append9", $rt_wrapFunction3(jl_AbstractStringBuilder_append2), "$insert4", $rt_wrapFunction4(jl_AbstractStringBuilder_insert)],
jl_Appendable, 0, jl_Object, [], 1537, 0, 0, 0,
jl_StringBuilder, 0, jl_AbstractStringBuilder, [jl_Appendable], 1, 0, 0, ["$_init_15", $rt_wrapFunction1(jl_StringBuilder__init_4), "$_init_0", $rt_wrapFunction0(jl_StringBuilder__init_3), "$_init_", $rt_wrapFunction1(jl_StringBuilder__init_2), "$append", $rt_wrapFunction1(jl_StringBuilder_append), "$append1", $rt_wrapFunction1(jl_StringBuilder_append2), "$append2", $rt_wrapFunction1(jl_StringBuilder_append1), "$append10", $rt_wrapFunction1(jl_StringBuilder_append4), "$append0", $rt_wrapFunction1(jl_StringBuilder_append0),
"$append11", $rt_wrapFunction3(jl_StringBuilder_append3), "$insert8", $rt_wrapFunction2(jl_StringBuilder_insert4), "$insert5", $rt_wrapFunction4(jl_StringBuilder_insert2), "$insert6", $rt_wrapFunction2(jl_StringBuilder_insert5), "$insert7", $rt_wrapFunction2(jl_StringBuilder_insert1), "$insert9", $rt_wrapFunction2(jl_StringBuilder_insert7), "$insert4", $rt_wrapFunction4(jl_StringBuilder_insert6), "$charAt", $rt_wrapFunction1(jl_StringBuilder_charAt), "$length", $rt_wrapFunction0(jl_StringBuilder_length), "$toString",
$rt_wrapFunction0(jl_StringBuilder_toString), "$ensureCapacity", $rt_wrapFunction1(jl_StringBuilder_ensureCapacity), "$insert", $rt_wrapFunction2(jl_StringBuilder_insert0), "$insert3", $rt_wrapFunction2(jl_StringBuilder_insert), "$insert2", $rt_wrapFunction2(jl_StringBuilder_insert3), "$insert0", $rt_wrapFunction2(jl_StringBuilder_insert8)],
otrfm_AbstractInMemoryVirtualFile, 0, jl_Object, [], 1025, 0, 0, ["$_init_", $rt_wrapFunction1(otrfm_AbstractInMemoryVirtualFile__init_)],
otrfm_InMemoryVirtualDirectory, 0, otrfm_AbstractInMemoryVirtualFile, [], 1, 0, 0, ["$_init_", $rt_wrapFunction1(otrfm_InMemoryVirtualDirectory__init_)],
oajqg_Phase, "Phase", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_7", $rt_wrapFunction2(oajqg_Phase__init_)],
ju_ConcurrentModificationException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_ConcurrentModificationException__init_0)],
oajqg_Hadamard, "Hadamard", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_Hadamard__init_)],
jur_RandomGenerator, 0, jl_Object, [], 1537, 0, 0, ["$nextBytes", $rt_wrapFunction1(jur_RandomGenerator_nextBytes)],
ju_Hashtable$1, 0, jl_Object, [ju_Enumeration], 0, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Hashtable$1__init_)],
ju_Iterator, 0, jl_Object, [], 1537, 0, 0, 0,
ju_Hashtable$2, 0, jl_Object, [ju_Iterator], 0, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Hashtable$2__init_)],
ju_Map$Entry, 0, jl_Object, [], 1537, 0, 0, 0,
ju_MapEntry, 0, jl_Object, [ju_Map$Entry, jl_Cloneable], 0, 0, 0, ["$_init_17", $rt_wrapFunction2(ju_MapEntry__init_), "$equals0", $rt_wrapFunction1(ju_MapEntry_equals), "$getKey", $rt_wrapFunction0(ju_MapEntry_getKey), "$getValue", $rt_wrapFunction0(ju_MapEntry_getValue), "$hashCode1", $rt_wrapFunction0(ju_MapEntry_hashCode), "$toString", $rt_wrapFunction0(ju_MapEntry_toString)],
ju_Hashtable$Entry, 0, ju_MapEntry, [], 0, 0, 0, ["$_init_17", $rt_wrapFunction2(ju_Hashtable$Entry__init_), "$getKeyHash", $rt_wrapFunction0(ju_Hashtable$Entry_getKeyHash), "$equalsKey", $rt_wrapFunction2(ju_Hashtable$Entry_equalsKey)],
oaju_Utils, 0, jl_Object, [], 1, 0, 0, 0,
oajqg_Reset, "Reset", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_Reset__init_)],
jl_ClassCastException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_ClassCastException__init_)],
ju_AbstractMap, 0, jl_Object, [ju_Map], 1025, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_AbstractMap__init_), "$equals0", $rt_wrapFunction1(ju_AbstractMap_equals), "$hashCode1", $rt_wrapFunction0(ju_AbstractMap_hashCode), "$toString", $rt_wrapFunction0(ju_AbstractMap_toString)],
ju_HashMap, 0, ju_AbstractMap, [jl_Cloneable, ji_Serializable], 1, 0, 0, ["$newElementArray", $rt_wrapFunction1(ju_HashMap_newElementArray), "$_init_0", $rt_wrapFunction0(ju_HashMap__init_0), "$_init_15", $rt_wrapFunction1(ju_HashMap__init_), "$_init_44", $rt_wrapFunction2(ju_HashMap__init_1), "$containsKey", $rt_wrapFunction1(ju_HashMap_containsKey), "$entryByKey", $rt_wrapFunction1(ju_HashMap_entryByKey), "$findNonNullKeyEntry", $rt_wrapFunction3(ju_HashMap_findNonNullKeyEntry), "$findNullKeyEntry", $rt_wrapFunction0(ju_HashMap_findNullKeyEntry),
"$keySet", $rt_wrapFunction0(ju_HashMap_keySet), "$put", $rt_wrapFunction2(ju_HashMap_put), "$rehash0", $rt_wrapFunction1(ju_HashMap_rehash0), "$rehash", $rt_wrapFunction0(ju_HashMap_rehash), "$removeEntry", $rt_wrapFunction1(ju_HashMap_removeEntry), "$size", $rt_wrapFunction0(ju_HashMap_size)],
ju_LinkedHashMap, "LinkedHashMap", 2, ju_HashMap, [ju_SequencedMap], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_LinkedHashMap__init_0), "$newElementArray", $rt_wrapFunction1(ju_LinkedHashMap_newElementArray), "$getOrDefault", $rt_wrapFunction2(ju_LinkedHashMap_getOrDefault), "$get0", $rt_wrapFunction1(ju_LinkedHashMap_get), "$put", $rt_wrapFunction2(ju_LinkedHashMap_put), "$putImpl0", $rt_wrapFunction4(ju_LinkedHashMap_putImpl), "$entrySet", $rt_wrapFunction0(ju_LinkedHashMap_entrySet), "$removeLinkedEntry",
$rt_wrapFunction1(ju_LinkedHashMap_removeLinkedEntry), "$removeEldestEntry", $rt_wrapFunction1(ju_LinkedHashMap_removeEldestEntry)],
jusi_FlatMappingStreamImpl$next$lambda$_1_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_74", $rt_wrapFunction1(jusi_FlatMappingStreamImpl$next$lambda$_1_0__init_), "$test1", $rt_wrapFunction1(jusi_FlatMappingStreamImpl$next$lambda$_1_0_test)],
oajq_QubitOne, 0, oajq_Qubit, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(oajq_QubitOne__init_0)],
oajqs_CircuitSampler, 0, jl_Object, [], 17, 0, 0, 0,
oajm_ComplexMatrix, "ComplexMatrix", 15, jl_Object, [], 1, 0, 0, ["$getEntry0", $rt_wrapFunction2(oajm_ComplexMatrix_getEntry), "$getRowDimension", $rt_wrapFunction0(oajm_ComplexMatrix_getRowDimension), "$getColumnDimension", $rt_wrapFunction0(oajm_ComplexMatrix_getColumnDimension), "$getData", $rt_wrapFunction0(oajm_ComplexMatrix_getData), "$equals0", $rt_wrapFunction1(oajm_ComplexMatrix_equals), "$hashCode1", $rt_wrapFunction0(oajm_ComplexMatrix_hashCode), "$toString", $rt_wrapFunction0(oajm_ComplexMatrix_toString)],
oajvs_CircuitSpecJson, 0, jl_Object, [], 17, 0, 0, 0,
oajqs_SamplingResult, 0, jl_Object, [], 17, 0, 0, ["$_init_50", $rt_wrapFunction3(oajqs_SamplingResult__init_), "$counts", $rt_wrapFunction0(oajqs_SamplingResult_counts)],
juf_IntFunction, 0, jl_Object, [], 1537, 0, 0, 0,
ju_TemplateCollections$AbstractImmutableMap, 0, ju_AbstractMap, [], 1024, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_TemplateCollections$AbstractImmutableMap__init_)],
ju_TemplateCollections$NEtriesMap, "TemplateCollections$NEtriesMap", 2, ju_TemplateCollections$AbstractImmutableMap, [], 0, 0, 0, ["$_init_16", $rt_wrapFunction1(ju_TemplateCollections$NEtriesMap__init_), "$_init_18", $rt_wrapFunction1(ju_TemplateCollections$NEtriesMap__init_0), "$size", $rt_wrapFunction0(ju_TemplateCollections$NEtriesMap_size), "$containsKey", $rt_wrapFunction1(ju_TemplateCollections$NEtriesMap_containsKey), "$get0", $rt_wrapFunction1(ju_TemplateCollections$NEtriesMap_get), "$entrySet", $rt_wrapFunction0(ju_TemplateCollections$NEtriesMap_entrySet)]]);
$rt_metadata([ju_HashMap$HashEntry, 0, ju_MapEntry, [], 0, 0, 0, ["$_init_46", $rt_wrapFunction2(ju_HashMap$HashEntry__init_)],
ju_LinkedHashMap$LinkedHashMapEntry, "LinkedHashMap$LinkedHashMapEntry", 2, ju_HashMap$HashEntry, [], 16, 0, 0, ["$_init_46", $rt_wrapFunction2(ju_LinkedHashMap$LinkedHashMapEntry__init_)],
jl_IllegalArgumentException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_IllegalArgumentException__init_2), "$_init_", $rt_wrapFunction1(jl_IllegalArgumentException__init_1)],
oaje_JQApiLimitException, 0, jl_IllegalArgumentException, [], 1, 0, 0, ["$_init_", $rt_wrapFunction1(oaje_JQApiLimitException__init_0)],
jl_Enum, 0, jl_Object, [jl_Comparable, ji_Serializable], 1025, 0, 0, ["$_init_20", $rt_wrapFunction2(jl_Enum__init_), "$name", $rt_wrapFunction0(jl_Enum_name), "$ordinal", $rt_wrapFunction0(jl_Enum_ordinal), "$toString", $rt_wrapFunction0(jl_Enum_toString), "$equals0", $rt_wrapFunction1(jl_Enum_equals), "$hashCode1", $rt_wrapFunction0(jl_Enum_hashCode)],
jus_Collector$Characteristics, "Collector$Characteristics", 3, jl_Enum, [], 65553, 0, () => jus_Collector$Characteristics_$callClinit(), 0,
oajm_ComplexVector, 0, jl_Object, [], 1, 0, 0, ["$_init_15", $rt_wrapFunction1(oajm_ComplexVector__init_0), "$_init_29", $rt_wrapFunction1(oajm_ComplexVector__init_), "$getEntry", $rt_wrapFunction1(oajm_ComplexVector_getEntry), "$setEntry", $rt_wrapFunction2(oajm_ComplexVector_setEntry), "$getDimension", $rt_wrapFunction0(oajm_ComplexVector_getDimension), "$getData0", $rt_wrapFunction0(oajm_ComplexVector_getData), "$outerProduct", $rt_wrapFunction1(oajm_ComplexVector_outerProduct), "$tensorProduct", $rt_wrapFunction1(oajm_ComplexVector_tensorProduct)],
ju_AbstractList$1, 0, jl_Object, [ju_Iterator], 0, 0, 0, ["$_init_64", $rt_wrapFunction1(ju_AbstractList$1__init_), "$hasNext", $rt_wrapFunction0(ju_AbstractList$1_hasNext), "$next", $rt_wrapFunction0(ju_AbstractList$1_next)],
otj_JSObject, 0, jl_Object, [], 1537, 0, 0, 0,
otjc_Crypto, 0, jl_Object, [otj_JSObject], 1025, 0, 0, 0,
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_78", $rt_wrapFunction1(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0__init_), "$accept0", $rt_wrapFunction1(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0_accept0), "$accept", $rt_wrapFunction1(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_0_accept)],
oaj_JQAPIConfig, 0, jl_Object, [], 17, 0, () => oaj_JQAPIConfig_$callClinit(), ["$maxQubits", $rt_wrapFunction0(oaj_JQAPIConfig_maxQubits), "$parallelEnabled", $rt_wrapFunction0(oaj_JQAPIConfig_parallelEnabled), "$parallelThreshold", $rt_wrapFunction0(oaj_JQAPIConfig_parallelThreshold), "$operatorExecutor", $rt_wrapFunction0(oaj_JQAPIConfig_operatorExecutor)],
oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_78", $rt_wrapFunction1(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1__init_), "$accept0", $rt_wrapFunction1(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1_accept0), "$accept", $rt_wrapFunction1(oajq_QuantumRegister$resetQubitAtIndexes$lambda$_25_1_accept)],
ju_TemplateCollections$NEtriesMap$1$1, 0, jl_Object, [ju_Iterator], 0, 0, 0, ["$_init_66", $rt_wrapFunction1(ju_TemplateCollections$NEtriesMap$1$1__init_), "$hasNext", $rt_wrapFunction0(ju_TemplateCollections$NEtriesMap$1$1_hasNext), "$next1", $rt_wrapFunction0(ju_TemplateCollections$NEtriesMap$1$1_next), "$next", $rt_wrapFunction0(ju_TemplateCollections$NEtriesMap$1$1_next0)],
jlr_Array, 0, jl_Object, [], 17, 0, 0, 0,
jusi_StreamOverSpliterator$AdapterAction, 0, jl_Object, [juf_Consumer], 0, 0, 0, ["$_init_40", $rt_wrapFunction1(jusi_StreamOverSpliterator$AdapterAction__init_), "$accept0", $rt_wrapFunction1(jusi_StreamOverSpliterator$AdapterAction_accept)],
ju_ListIterator, 0, jl_Object, [ju_Iterator], 1537, 0, 0, 0,
jus_CollectorImpl, 0, jl_Object, [jus_Collector], 0, 0, 0, ["$_init_26", function(var_1, var_2, var_3, var_4, var_5) { jus_CollectorImpl__init_(this, var_1, var_2, var_3, var_4, var_5); }, "$supplier", $rt_wrapFunction0(jus_CollectorImpl_supplier), "$accumulator", $rt_wrapFunction0(jus_CollectorImpl_accumulator), "$finisher", $rt_wrapFunction0(jus_CollectorImpl_finisher)],
juf_BiFunction, 0, jl_Object, [], 1537, 0, 0, 0,
otcit_DoubleAnalyzer$Result, 0, jl_Object, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(otcit_DoubleAnalyzer$Result__init_0)],
ju_Random, 0, jl_Object, [jur_RandomGenerator, ji_Serializable], 1, 0, 0, ["$nextBytes", $rt_wrapFunction1(jur_RandomGenerator_nextBytes), "$_init_0", $rt_wrapFunction0(ju_Random__init_), "$_init_56", $rt_wrapFunction1(ju_Random__init_0), "$setSeed", $rt_wrapFunction1(ju_Random_setSeed)],
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_78", $rt_wrapFunction1(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0__init_), "$accept0", $rt_wrapFunction1(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0_accept0), "$accept", $rt_wrapFunction1(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_0_accept)],
otpp_ResourceAccessor, 0, jl_Object, [], 16, 0, 0, 0,
oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_78", $rt_wrapFunction1(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1__init_), "$accept0", $rt_wrapFunction1(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1_accept0), "$accept", $rt_wrapFunction1(oajq_QuantumRegister$measureQubitAtIndexes$lambda$_23_1_accept)],
jusi_FilteringIntStreamImpl$wrap$lambda$_1_0, 0, jl_Object, [juf_IntPredicate], 1, 0, 0, ["$_init_72", $rt_wrapFunction2(jusi_FilteringIntStreamImpl$wrap$lambda$_1_0__init_), "$test2", $rt_wrapFunction1(jusi_FilteringIntStreamImpl$wrap$lambda$_1_0_test)],
otci_IntegerUtil, 0, jl_Object, [], 17, 0, 0, 0,
jl_Thread$UncaughtExceptionHandler, 0, jl_Object, [], 1537, 0, 0, 0,
jl_DefaultUncaughtExceptionHandler, 0, jl_Object, [jl_Thread$UncaughtExceptionHandler], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_DefaultUncaughtExceptionHandler__init_)],
otji_JS, 0, jl_Object, [], 17, 0, 0, 0,
otp_PlatformRunnable, 0, jl_Object, [], 1537, 0, 0, 0,
oajq_OperatorExecutor, 0, jl_Object, [], 1537, 0, 0, 0,
oajq_SequentialOperatorExecutor, 0, jl_Object, [oajq_OperatorExecutor], 17, 0, 0, ["$_init_0", $rt_wrapFunction0(oajq_SequentialOperatorExecutor__init_), "$applyGroups", $rt_wrapFunction3(oajq_SequentialOperatorExecutor_applyGroups)],
otciu_UnicodeHelper, 0, jl_Object, [], 17, 0, 0, 0,
jus_Collectors, 0, jl_Object, [], 17, 0, 0, 0,
jl_Object$monitorEnterWait$lambda$_6_0, "Object$monitorEnterWait$lambda$_6_0", 6, jl_Object, [otp_PlatformRunnable], 1, 0, 0, ["$_init_1", $rt_wrapFunction4(jl_Object$monitorEnterWait$lambda$_6_0__init_), "$run", $rt_wrapFunction0(jl_Object$monitorEnterWait$lambda$_6_0_run)],
juf_BinaryOperator, 0, jl_Object, [juf_BiFunction], 1537, 0, 0, 0,
ju_Objects, 0, jl_Object, [], 17, 0, 0, 0,
jusi_StreamOverSpliterator, 0, jusi_SimpleStreamImpl, [], 1, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList), "$_init_27", $rt_wrapFunction1(jusi_StreamOverSpliterator__init_), "$next0", $rt_wrapFunction1(jusi_StreamOverSpliterator_next), "$estimateSize", $rt_wrapFunction0(jusi_StreamOverSpliterator_estimateSize)],
ju_Queue, 0, jl_Object, [ju_Collection], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream)],
jl_ArrayStoreException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_ArrayStoreException__init_0)],
ju_Spliterator, 0, jl_Object, [], 1537, 0, 0, 0,
ju_SequencedCollection, 0, jl_Object, [ju_Collection], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream)],
jusi_SpliteratorOverCollection, 0, jl_Object, [ju_Spliterator], 1, 0, 0, ["$_init_13", $rt_wrapFunction1(jusi_SpliteratorOverCollection__init_), "$tryAdvance", $rt_wrapFunction1(jusi_SpliteratorOverCollection_tryAdvance), "$estimateSize0", $rt_wrapFunction0(jusi_SpliteratorOverCollection_estimateSize)],
ju_HashMap$AbstractMapIterator, 0, jl_Object, [], 0, 0, 0, ["$_init_45", $rt_wrapFunction1(ju_HashMap$AbstractMapIterator__init_), "$hasNext", $rt_wrapFunction0(ju_HashMap$AbstractMapIterator_hasNext), "$checkConcurrentMod", $rt_wrapFunction0(ju_HashMap$AbstractMapIterator_checkConcurrentMod), "$makeNext", $rt_wrapFunction0(ju_HashMap$AbstractMapIterator_makeNext)],
ju_HashMap$KeyIterator, 0, ju_HashMap$AbstractMapIterator, [ju_Iterator], 0, 0, 0, ["$_init_45", $rt_wrapFunction1(ju_HashMap$KeyIterator__init_), "$next", $rt_wrapFunction0(ju_HashMap$KeyIterator_next)],
juf_DoubleSupplier, 0, jl_Object, [], 1537, 0, 0, 0,
oajqs_SamplingOptions$lambda$new$0$lambda$_12_0, "SamplingOptions$lambda$new$0$lambda$_12_0", 14, jl_Object, [juf_DoubleSupplier], 1, 0, 0, ["$_init_76", $rt_wrapFunction1(oajqs_SamplingOptions$lambda$new$0$lambda$_12_0__init_), "$getAsDouble", $rt_wrapFunction0(oajqs_SamplingOptions$lambda$new$0$lambda$_12_0_getAsDouble)],
otji_JSWrapper, 0, jl_Object, [], 17, 0, 0, 0,
juf_Function, 0, jl_Object, [], 1537, 0, 0, 0,
ju_HashSet, "HashSet", 2, ju_AbstractSet, [jl_Cloneable, ji_Serializable], 1, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_HashSet__init_0), "$_init_45", $rt_wrapFunction1(ju_HashSet__init_), "$add", $rt_wrapFunction1(ju_HashSet_add), "$contains", $rt_wrapFunction1(ju_HashSet_contains), "$iterator", $rt_wrapFunction0(ju_HashSet_iterator), "$size", $rt_wrapFunction0(ju_HashSet_size)]]);
$rt_metadata([otp_Platform, 0, jl_Object, [], 17, 0, 0, 0,
jl_Boolean, "Boolean", 6, jl_Object, [ji_Serializable, jl_Comparable], 1, 0, () => jl_Boolean_$callClinit(), ["$_init_59", $rt_wrapFunction1(jl_Boolean__init_0), "$toString", $rt_wrapFunction0(jl_Boolean_toString), "$hashCode1", $rt_wrapFunction0(jl_Boolean_hashCode), "$equals0", $rt_wrapFunction1(jl_Boolean_equals)],
ju_NoSuchElementException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_NoSuchElementException__init_0)],
oajvs_ComplexCell, "ComplexCell", 11, jl_Record, [], 17, 0, 0, ["$_init_14", $rt_wrapFunction2(oajvs_ComplexCell__init_), "$toString", $rt_wrapFunction0(oajvs_ComplexCell_toString), "$hashCode1", $rt_wrapFunction0(oajvs_ComplexCell_hashCode), "$equals0", $rt_wrapFunction1(oajvs_ComplexCell_equals), "$re", $rt_wrapFunction0(oajvs_ComplexCell_re), "$im", $rt_wrapFunction0(oajvs_ComplexCell_im)],
jlr_AnnotatedElement, 0, jl_Object, [], 1537, 0, 0, 0,
jlr_GenericDeclaration, 0, jl_Object, [jlr_AnnotatedElement], 1537, 0, 0, 0,
oajqg_U3, "U3", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_8", $rt_wrapFunction4(oajqg_U3__init_)],
oti_AsyncCallback, 0, jl_Object, [], 1537, 0, 0, 0,
oajm_Complex, "Complex", 15, jl_Object, [], 17, 0, () => oajm_Complex_$callClinit(), ["$_init_14", $rt_wrapFunction2(oajm_Complex__init_0), "$getReal", $rt_wrapFunction0(oajm_Complex_getReal), "$getImaginary", $rt_wrapFunction0(oajm_Complex_getImaginary), "$multiply2", $rt_wrapFunction1(oajm_Complex_multiply0), "$multiply", $rt_wrapFunction1(oajm_Complex_multiply), "$equals0", $rt_wrapFunction1(oajm_Complex_equals), "$toString", $rt_wrapFunction0(oajm_Complex_toString)],
oajvs_GateKind, "GateKind", 11, jl_Enum, [], 65553, 0, () => oajvs_GateKind_$callClinit(), 0,
jlr_Type, 0, jl_Object, [], 1537, 0, 0, 0,
jl_Class, "Class", 6, jl_Object, [jlr_GenericDeclaration, jlr_Type], 17, 0, 0, ["$toString", $rt_wrapFunction0(jl_Class_toString), "$getClassInfo", $rt_wrapFunction0(jl_Class_getClassInfo), "$isInstance", $rt_wrapFunction1(jl_Class_isInstance), "$isAssignableFrom", $rt_wrapFunction1(jl_Class_isAssignableFrom), "$getName", $rt_wrapFunction0(jl_Class_getName), "$isPrimitive", $rt_wrapFunction0(jl_Class_isPrimitive), "$isEnum", $rt_wrapFunction0(jl_Class_isEnum), "$isInterface", $rt_wrapFunction0(jl_Class_isInterface),
"$getComponentType", $rt_wrapFunction0(jl_Class_getComponentType), "$getSuperclass", $rt_wrapFunction0(jl_Class_getSuperclass), "$getEnumConstants", $rt_wrapFunction0(jl_Class_getEnumConstants), "$initialize", $rt_wrapFunction0(jl_Class_initialize)],
ju_Arrays, 0, jl_Object, [], 1, 0, 0, 0,
jl_System, 0, jl_Object, [], 17, 0, 0, 0,
jm_Conversion, 0, jl_Object, [], 0, 0, () => jm_Conversion_$callClinit(), 0,
oajqg_ControlledSwap, "ControlledSwap", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_10", $rt_wrapFunction3(oajqg_ControlledSwap__init_)],
js_SecureRandom, "SecureRandom", 1, ju_Random, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(js_SecureRandom__init_0), "$next2", $rt_wrapFunction1(js_SecureRandom_next), "$nextBytes", $rt_wrapFunction1(js_SecureRandom_nextBytes), "$nextInt", $rt_wrapFunction0(js_SecureRandom_nextInt), "$nextDouble", $rt_wrapFunction0(js_SecureRandom_nextDouble)],
ju_Collections$5, 0, jl_Object, [ju_ListIterator], 0, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Collections$5__init_)],
jusi_DistinctStreamImpl$wrap$lambda$_1_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_41", $rt_wrapFunction2(jusi_DistinctStreamImpl$wrap$lambda$_1_0__init_), "$test1", $rt_wrapFunction1(jusi_DistinctStreamImpl$wrap$lambda$_1_0_test)],
jm_BigDecimal, 0, jl_Number, [jl_Comparable, ji_Serializable], 1, 0, () => jm_BigDecimal_$callClinit(), ["$_init_43", $rt_wrapFunction3(jm_BigDecimal__init_1), "$_init_", $rt_wrapFunction1(jm_BigDecimal__init_4), "$_init_63", $rt_wrapFunction2(jm_BigDecimal__init_2), "$signum", $rt_wrapFunction0(jm_BigDecimal_signum), "$setScale", $rt_wrapFunction2(jm_BigDecimal_setScale), "$doubleValue", $rt_wrapFunction0(jm_BigDecimal_doubleValue)],
ju_List, 0, jl_Object, [ju_SequencedCollection], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream)],
ju_AbstractList, 0, ju_AbstractCollection, [ju_List], 1025, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_AbstractList__init_), "$iterator", $rt_wrapFunction0(ju_AbstractList_iterator), "$hashCode1", $rt_wrapFunction0(ju_AbstractList_hashCode), "$equals0", $rt_wrapFunction1(ju_AbstractList_equals)],
ju_RandomAccess, 0, jl_Object, [], 1537, 0, 0, 0,
ju_TemplateCollections$AbstractImmutableList, 0, ju_AbstractList, [ju_RandomAccess], 1024, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_TemplateCollections$AbstractImmutableList__init_)],
ju_Collections$3, 0, ju_TemplateCollections$AbstractImmutableList, [], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_Collections$3__init_)],
ju_Collections$4, 0, jl_Object, [ju_Iterator], 0, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Collections$4__init_), "$hasNext", $rt_wrapFunction0(ju_Collections$4_hasNext), "$next", $rt_wrapFunction0(ju_Collections$4_next)],
jl_Character, 0, jl_Object, [jl_Comparable], 1, 0, () => jl_Character_$callClinit(), 0,
ju_TemplateCollections$AbstractImmutableSet, 0, ju_AbstractSet, [], 1024, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_TemplateCollections$AbstractImmutableSet__init_)],
ju_Collections$1, 0, ju_TemplateCollections$AbstractImmutableSet, [], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_Collections$1__init_), "$size", $rt_wrapFunction0(ju_Collections$1_size), "$iterator", $rt_wrapFunction0(ju_Collections$1_iterator)],
jusi_SimpleStreamImpl$toArray$lambda$_21_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_38", $rt_wrapFunction1(jusi_SimpleStreamImpl$toArray$lambda$_21_0__init_), "$test1", $rt_wrapFunction1(jusi_SimpleStreamImpl$toArray$lambda$_21_0_test)],
ju_Collections$2, 0, ju_TemplateCollections$AbstractImmutableMap, [], 0, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Collections$2__init_), "$entrySet", $rt_wrapFunction0(ju_Collections$2_entrySet)],
otrr_ReflectionInfo, 0, jl_Object, [], 1025, 0, 0, 0,
oajvs_LevelSpec, "LevelSpec", 11, jl_Record, [], 17, 0, 0, ["$_init_38", $rt_wrapFunction1(oajvs_LevelSpec__init_), "$toString", $rt_wrapFunction0(oajvs_LevelSpec_toString), "$hashCode1", $rt_wrapFunction0(oajvs_LevelSpec_hashCode), "$equals0", $rt_wrapFunction1(oajvs_LevelSpec_equals), "$gates", $rt_wrapFunction0(oajvs_LevelSpec_gates)],
oajqg_ControlledY, "ControlledY", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_9", $rt_wrapFunction2(oajqg_ControlledY__init_)],
oajqg_ControlledZ, "ControlledZ", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_9", $rt_wrapFunction2(oajqg_ControlledZ__init_)],
jl_Object$monitorExit$lambda$_8_1, 0, jl_Object, [otp_PlatformRunnable], 1, 0, 0, ["$_init_2", $rt_wrapFunction1(jl_Object$monitorExit$lambda$_8_1__init_), "$run", $rt_wrapFunction0(jl_Object$monitorExit$lambda$_8_1_run)],
jl_MatchException, 0, jl_RuntimeException, [], 17, 0, 0, ["$_init_4", $rt_wrapFunction2(jl_MatchException__init_)],
oajqg_Oracle, "Oracle", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_12", $rt_wrapFunction2(oajqg_Oracle__init_)],
ju_SequencedSet, 0, jl_Object, [ju_SequencedCollection, ju_Set], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream)],
ju_Collections$_clinit_$lambda$_59_0, 0, jl_Object, [ju_Comparator], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Collections$_clinit_$lambda$_59_0__init_)],
oajvs_GateSpec$_init_$lambda$_0_0, 0, jl_Object, [juf_Function], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(oajvs_GateSpec$_init_$lambda$_0_0__init_), "$apply0", $rt_wrapFunction1(oajvs_GateSpec$_init_$lambda$_0_0_apply0), "$apply1", $rt_wrapFunction1(oajvs_GateSpec$_init_$lambda$_0_0_apply)],
ju_LinkedHashMapIterator, 0, jl_Object, [], 0, 0, 0, ["$_init_47", $rt_wrapFunction2(ju_LinkedHashMapIterator__init_), "$hasNext", $rt_wrapFunction0(ju_LinkedHashMapIterator_hasNext), "$checkConcurrentMod", $rt_wrapFunction0(ju_LinkedHashMapIterator_checkConcurrentMod), "$makeNext", $rt_wrapFunction0(ju_LinkedHashMapIterator_makeNext)],
jusi_AnyMatchConsumer, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_40", $rt_wrapFunction1(jusi_AnyMatchConsumer__init_), "$test1", $rt_wrapFunction1(jusi_AnyMatchConsumer_test)],
jm_Multiplication, 0, jl_Object, [], 0, 0, () => jm_Multiplication_$callClinit(), 0,
ju_TemplateCollections$NEtriesMap$1, 0, ju_TemplateCollections$AbstractImmutableSet, [], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_54", $rt_wrapFunction1(ju_TemplateCollections$NEtriesMap$1__init_), "$iterator", $rt_wrapFunction0(ju_TemplateCollections$NEtriesMap$1_iterator)],
ju_Dictionary, 0, jl_Object, [], 1025, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Dictionary__init_)],
oajqg_Toffoli, "Toffoli", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_10", $rt_wrapFunction3(oajqg_Toffoli__init_)],
otrf_VirtualFileSystemProvider, 0, jl_Object, [], 17, 0, 0, 0,
oajv_CircuitSpecs$1, 0, jl_Object, [], 32768, 0, () => oajv_CircuitSpecs$1_$callClinit(), 0,
ju_HashMap$1, 0, ju_AbstractSet, [], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_45", $rt_wrapFunction1(ju_HashMap$1__init_), "$iterator", $rt_wrapFunction0(ju_HashMap$1_iterator)]]);
$rt_metadata([jl_Double, "Double", 6, jl_Number, [jl_Comparable], 1, 0, () => jl_Double_$callClinit(), ["$_init_30", $rt_wrapFunction1(jl_Double__init_), "$doubleValue", $rt_wrapFunction0(jl_Double_doubleValue), "$toString", $rt_wrapFunction0(jl_Double_toString0), "$equals0", $rt_wrapFunction1(jl_Double_equals0), "$hashCode1", $rt_wrapFunction0(jl_Double_hashCode0)],
jm_Elementary, 0, jl_Object, [], 0, 0, 0, 0,
oajqs_SamplingOptions$_init_$lambda$_0_0, "SamplingOptions$<init>$lambda$_0_0", 14, jl_Object, [juf_Supplier], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(oajqs_SamplingOptions$_init_$lambda$_0_0__init_), "$get2", $rt_wrapFunction0(oajqs_SamplingOptions$_init_$lambda$_0_0_get0), "$get3", $rt_wrapFunction0(oajqs_SamplingOptions$_init_$lambda$_0_0_get)],
ju_TemplateCollections$ImmutableEntry, "TemplateCollections$ImmutableEntry", 2, jl_Object, [ju_Map$Entry, jl_Cloneable], 0, 0, 0, ["$_init_17", $rt_wrapFunction2(ju_TemplateCollections$ImmutableEntry__init_), "$equals0", $rt_wrapFunction1(ju_TemplateCollections$ImmutableEntry_equals), "$getKey", $rt_wrapFunction0(ju_TemplateCollections$ImmutableEntry_getKey), "$getValue", $rt_wrapFunction0(ju_TemplateCollections$ImmutableEntry_getValue), "$hashCode1", $rt_wrapFunction0(ju_TemplateCollections$ImmutableEntry_hashCode),
"$toString", $rt_wrapFunction0(ju_TemplateCollections$ImmutableEntry_toString)],
ju_ArrayList, "ArrayList", 2, ju_AbstractList, [jl_Cloneable, ji_Serializable, ju_RandomAccess], 1, 0, 0, ["$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_ArrayList__init_3), "$_init_15", $rt_wrapFunction1(ju_ArrayList__init_1), "$_init_13", $rt_wrapFunction1(ju_ArrayList__init_2), "$ensureCapacity", $rt_wrapFunction1(ju_ArrayList_ensureCapacity), "$get", $rt_wrapFunction1(ju_ArrayList_get), "$size", $rt_wrapFunction0(ju_ArrayList_size),
"$add", $rt_wrapFunction1(ju_ArrayList_add), "$add1", $rt_wrapFunction2(ju_ArrayList_add0), "$forEach", $rt_wrapFunction1(ju_ArrayList_forEach), "$toString", $rt_wrapFunction0(ju_ArrayList_toString), "$hashCode1", $rt_wrapFunction0(ju_ArrayList_hashCode)],
otrf_VirtualFileSystem, 0, jl_Object, [], 1537, 0, 0, 0,
jl_IllegalMonitorStateException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_IllegalMonitorStateException__init_)],
ju_LinkedHashMapIterator$EntryIterator, 0, ju_LinkedHashMapIterator, [ju_Iterator], 0, 0, 0, ["$_init_47", $rt_wrapFunction2(ju_LinkedHashMapIterator$EntryIterator__init_), "$next1", $rt_wrapFunction0(ju_LinkedHashMapIterator$EntryIterator_next), "$next", $rt_wrapFunction0(ju_LinkedHashMapIterator$EntryIterator_next0)],
jm_Division, 0, jl_Object, [], 0, 0, 0, 0,
jm_BitLevel, 0, jl_Object, [], 0, 0, 0, 0,
jusi_SimpleStreamImpl$toArray$lambda$_20_0, 0, jl_Object, [juf_IntFunction], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jusi_SimpleStreamImpl$toArray$lambda$_20_0__init_), "$apply", $rt_wrapFunction1(jusi_SimpleStreamImpl$toArray$lambda$_20_0_apply0), "$apply2", $rt_wrapFunction1(jusi_SimpleStreamImpl$toArray$lambda$_20_0_apply)],
juf_BiConsumer, 0, jl_Object, [], 1537, 0, 0, 0,
jusi_WrappingIntStreamImpl, 0, jusi_SimpleIntStreamImpl, [], 1025, 0, 0, ["$_init_25", $rt_wrapFunction1(jusi_WrappingIntStreamImpl__init_), "$next3", $rt_wrapFunction1(jusi_WrappingIntStreamImpl_next)],
jl_String, "String", 6, jl_Object, [ji_Serializable, jl_Comparable, jl_CharSequence], 17, 0, () => jl_String_$callClinit(), ["$_init_0", $rt_wrapFunction0(jl_String__init_0), "$_init_57", $rt_wrapFunction1(jl_String__init_1), "$_init_2", $rt_wrapFunction1(jl_String__init_3), "$_init_43", $rt_wrapFunction3(jl_String__init_4), "$charAt", $rt_wrapFunction1(jl_String_charAt), "$length", $rt_wrapFunction0(jl_String_length), "$isEmpty", $rt_wrapFunction0(jl_String_isEmpty), "$startsWith", $rt_wrapFunction2(jl_String_startsWith),
"$regionMatches", function(var_1, var_2, var_3, var_4, var_5) { return jl_String_regionMatches(this, var_1, var_2, var_3, var_4, var_5); }, "$indexOf", $rt_wrapFunction2(jl_String_indexOf), "$indexOf0", $rt_wrapFunction1(jl_String_indexOf0), "$substring", $rt_wrapFunction2(jl_String_substring), "$subSequence", $rt_wrapFunction2(jl_String_subSequence), "$toString", $rt_wrapFunction0(jl_String_toString), "$toCharArray", $rt_wrapFunction0(jl_String_toCharArray), "$equals0", $rt_wrapFunction1(jl_String_equals),
"$hashCode1", $rt_wrapFunction0(jl_String_hashCode), "$toLowerCase", $rt_wrapFunction0(jl_String_toLowerCase)],
jusi_SimpleStreamImpl$ArrayFillingConsumer, 0, jl_Object, [juf_Predicate], 0, 0, 0, ["$_init_35", $rt_wrapFunction1(jusi_SimpleStreamImpl$ArrayFillingConsumer__init_), "$test1", $rt_wrapFunction1(jusi_SimpleStreamImpl$ArrayFillingConsumer_test)],
jl_NegativeArraySizeException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_NegativeArraySizeException__init_)],
jusi_MappingStreamImpl$wrap$lambda$_1_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_73", $rt_wrapFunction2(jusi_MappingStreamImpl$wrap$lambda$_1_0__init_), "$test1", $rt_wrapFunction1(jusi_MappingStreamImpl$wrap$lambda$_1_0_test)],
oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_33", $rt_wrapFunction1(oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0__init_), "$accept0", $rt_wrapFunction1(oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0_accept0), "$accept4", $rt_wrapFunction1(oajqs_LocalSimulator$lambda$execute$0$lambda$_7_0_accept)],
ju_Hashtable, 0, ju_Dictionary, [ju_Map, jl_Cloneable, ji_Serializable], 1, 0, () => ju_Hashtable_$callClinit(), ["$_init_0", $rt_wrapFunction0(ju_Hashtable__init_), "$_init_15", $rt_wrapFunction1(ju_Hashtable__init_0), "$get0", $rt_wrapFunction1(ju_Hashtable_get), "$put", $rt_wrapFunction2(ju_Hashtable_put), "$rehash", $rt_wrapFunction0(ju_Hashtable_rehash)],
ju_Properties, 0, ju_Hashtable, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(ju_Properties__init_), "$_init_61", $rt_wrapFunction1(ju_Properties__init_0), "$getProperty", $rt_wrapFunction1(ju_Properties_getProperty)],
jus_Collectors$toCollection$lambda$_1_1, 0, jl_Object, [juf_BinaryOperator], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jus_Collectors$toCollection$lambda$_1_1__init_)],
oajqg_Identity, "Identity", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_Identity__init_)],
jus_Collectors$toCollection$lambda$_1_0, 0, jl_Object, [juf_BiConsumer], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jus_Collectors$toCollection$lambda$_1_0__init_), "$accept1", $rt_wrapFunction2(jus_Collectors$toCollection$lambda$_1_0_accept0), "$accept5", $rt_wrapFunction2(jus_Collectors$toCollection$lambda$_1_0_accept)],
jl_NumberFormatException, 0, jl_IllegalArgumentException, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_NumberFormatException__init_2), "$_init_", $rt_wrapFunction1(jl_NumberFormatException__init_0)],
jusi_BoxedIntStream, 0, jusi_SimpleStreamImpl, [], 1, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList), "$_init_25", $rt_wrapFunction1(jusi_BoxedIntStream__init_), "$next0", $rt_wrapFunction1(jusi_BoxedIntStream_next)],
oajw_JqapiBridge, 0, jl_Object, [], 17, 0, () => oajw_JqapiBridge_$callClinit(), 0,
ju_Deque, 0, jl_Object, [ju_Queue, ju_SequencedCollection], 1537, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream)],
ju_ArrayDeque, 0, ju_AbstractCollection, [ju_Deque, jl_Cloneable, ji_Serializable], 1, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_0", $rt_wrapFunction0(ju_ArrayDeque__init_0), "$_init_15", $rt_wrapFunction1(ju_ArrayDeque__init_), "$addLast", $rt_wrapFunction1(ju_ArrayDeque_addLast), "$removeFirst", $rt_wrapFunction0(ju_ArrayDeque_removeFirst), "$pollFirst", $rt_wrapFunction0(ju_ArrayDeque_pollFirst),
"$add", $rt_wrapFunction1(ju_ArrayDeque_add), "$remove", $rt_wrapFunction0(ju_ArrayDeque_remove), "$size", $rt_wrapFunction0(ju_ArrayDeque_size), "$isEmpty", $rt_wrapFunction0(ju_ArrayDeque_isEmpty)],
jusi_SimpleStreamIterator, 0, jl_Object, [ju_Iterator], 1, 0, 0, ["$_init_37", $rt_wrapFunction1(jusi_SimpleStreamIterator__init_), "$hasNext", $rt_wrapFunction0(jusi_SimpleStreamIterator_hasNext), "$next", $rt_wrapFunction0(jusi_SimpleStreamIterator_next)],
oajq_QuantumRegister$_init_$lambda$_3_0, "QuantumRegister$<init>$lambda$_3_0", 12, jl_Object, [juf_DoubleSupplier], 1, 0, 0, ["$_init_76", $rt_wrapFunction1(oajq_QuantumRegister$_init_$lambda$_3_0__init_), "$getAsDouble", $rt_wrapFunction0(oajq_QuantumRegister$_init_$lambda$_3_0_getAsDouble)],
jusi_AllMatchConsumer, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_40", $rt_wrapFunction1(jusi_AllMatchConsumer__init_), "$test1", $rt_wrapFunction1(jusi_AllMatchConsumer_test)],
jl_IllegalStateException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_", $rt_wrapFunction1(jl_IllegalStateException__init_)],
oajqg_ControlledNot, "ControlledNot", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_9", $rt_wrapFunction2(oajqg_ControlledNot__init_)],
juf_IntConsumer, 0, jl_Object, [], 1537, 0, 0, 0,
oajvs_CircuitSpecJson$JsonParser, 0, jl_Object, [], 16, 0, 0, ["$_init_", $rt_wrapFunction1(oajvs_CircuitSpecJson$JsonParser__init_), "$parse", $rt_wrapFunction0(oajvs_CircuitSpecJson$JsonParser_parse)],
jl_NullPointerException, 0, jl_RuntimeException, [], 1, 0, 0, ["$_init_", $rt_wrapFunction1(jl_NullPointerException__init_2), "$_init_0", $rt_wrapFunction0(jl_NullPointerException__init_0)],
jus_Collector$of$lambda$_5_0, 0, jl_Object, [juf_Function], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jus_Collector$of$lambda$_5_0__init_), "$apply0", $rt_wrapFunction1(jus_Collector$of$lambda$_5_0_apply)],
otpp_AsyncCallbackWrapper, 0, jl_Object, [oti_AsyncCallback], 0, 0, 0, ["$_init_69", $rt_wrapFunction1(otpp_AsyncCallbackWrapper__init_), "$complete", $rt_wrapFunction1(otpp_AsyncCallbackWrapper_complete), "$error0", $rt_wrapFunction1(otpp_AsyncCallbackWrapper_error)],
jl_Object$Monitor, 0, jl_Object, [], 0, 0, 0, ["$_init_0", $rt_wrapFunction0(jl_Object$Monitor__init_)],
ju_LinkedHashMapEntrySet, 0, ju_AbstractSet, [ju_SequencedSet], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_47", $rt_wrapFunction2(ju_LinkedHashMapEntrySet__init_), "$size", $rt_wrapFunction0(ju_LinkedHashMapEntrySet_size), "$iterator", $rt_wrapFunction0(ju_LinkedHashMapEntrySet_iterator)],
jl_Math, 0, jl_Object, [], 17, 0, 0, 0,
jm_RoundingMode, "RoundingMode", 5, jl_Enum, [], 65553, 0, () => jm_RoundingMode_$callClinit(), 0,
oajq_Circuit, "Circuit", 12, jl_Object, [], 1, 0, 0, ["$_init_5", $rt_wrapFunction2(oajq_Circuit__init_), "$getInputSize", $rt_wrapFunction0(oajq_Circuit_getInputSize), "$getConfig", $rt_wrapFunction0(oajq_Circuit_getConfig), "$getLevels", $rt_wrapFunction0(oajq_Circuit_getLevels), "$addLevel", $rt_wrapFunction1(oajq_Circuit_addLevel)],
oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0, 0, jl_Object, [juf_Consumer], 1, 0, 0, ["$_init_34", $rt_wrapFunction2(oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0__init_), "$accept0", $rt_wrapFunction1(oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0_accept0), "$accept", $rt_wrapFunction1(oajqs_LocalSimulator$lambda$execute$1$lambda$_8_0_accept)],
ju_TemplateCollections$SingleElementList, "TemplateCollections$SingleElementList", 2, ju_TemplateCollections$AbstractImmutableList, [ju_RandomAccess], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_2", $rt_wrapFunction1(ju_TemplateCollections$SingleElementList__init_), "$size", $rt_wrapFunction0(ju_TemplateCollections$SingleElementList_size), "$get", $rt_wrapFunction1(ju_TemplateCollections$SingleElementList_get)],
oajq_QuantumRegister$applyOperator$lambda$_18_0, 0, jl_Object, [juf_IntConsumer], 1, 0, 0, ["$_init_77", function(var_1, var_2, var_3, var_4, var_5, var_6) { oajq_QuantumRegister$applyOperator$lambda$_18_0__init_(this, var_1, var_2, var_3, var_4, var_5, var_6); }, "$accept3", $rt_wrapFunction1(oajq_QuantumRegister$applyOperator$lambda$_18_0_accept)],
jusi_FilteringIntStreamImpl, 0, jusi_WrappingIntStreamImpl, [], 1, 0, 0, ["$_init_24", $rt_wrapFunction2(jusi_FilteringIntStreamImpl__init_), "$wrap0", $rt_wrapFunction1(jusi_FilteringIntStreamImpl_wrap)],
jusi_MappingStreamImpl, 0, jusi_WrappingStreamImpl, [], 1, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList), "$_init_36", $rt_wrapFunction2(jusi_MappingStreamImpl__init_), "$wrap", $rt_wrapFunction1(jusi_MappingStreamImpl_wrap)],
ju_TemplateCollections$ImmutableArrayList, "TemplateCollections$ImmutableArrayList", 2, ju_TemplateCollections$AbstractImmutableList, [ju_RandomAccess], 1, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_35", $rt_wrapFunction1(ju_TemplateCollections$ImmutableArrayList__init_), "$_init_13", $rt_wrapFunction1(ju_TemplateCollections$ImmutableArrayList__init_0), "$get", $rt_wrapFunction1(ju_TemplateCollections$ImmutableArrayList_get),
"$size", $rt_wrapFunction0(ju_TemplateCollections$ImmutableArrayList_size)],
oajq_CircuitLevel$verify$lambda$_5_1, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_38", $rt_wrapFunction1(oajq_CircuitLevel$verify$lambda$_5_1__init_), "$test1", $rt_wrapFunction1(oajq_CircuitLevel$verify$lambda$_5_1_test0), "$test0", $rt_wrapFunction1(oajq_CircuitLevel$verify$lambda$_5_1_test)]]);
$rt_metadata([oajq_CircuitLevel$verify$lambda$_5_0, 0, jl_Object, [juf_Function], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(oajq_CircuitLevel$verify$lambda$_5_0__init_), "$apply0", $rt_wrapFunction1(oajq_CircuitLevel$verify$lambda$_5_0_apply0), "$apply3", $rt_wrapFunction1(oajq_CircuitLevel$verify$lambda$_5_0_apply)],
oajvs_CircuitSpec, 0, jl_Record, [], 17, 0, 0, ["$_init_52", $rt_wrapFunction3(oajvs_CircuitSpec__init_), "$numQubits", $rt_wrapFunction0(oajvs_CircuitSpec_numQubits), "$levels", $rt_wrapFunction0(oajvs_CircuitSpec_levels)],
otcit_DoubleAnalyzer, 0, jl_Object, [], 17, 0, () => otcit_DoubleAnalyzer_$callClinit(), 0,
jusi_CountingConsumer, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(jusi_CountingConsumer__init_), "$test1", $rt_wrapFunction1(jusi_CountingConsumer_test)],
otr_StringInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, 0,
otciu_CharMapping, 0, jl_Object, [], 1, 0, 0, ["$_init_58", $rt_wrapFunction2(otciu_CharMapping__init_)],
oajqg_Swap, "Swap", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_9", $rt_wrapFunction2(oajqg_Swap__init_)],
otci_CharFlow, 0, jl_Object, [], 1, 0, 0, ["$_init_57", $rt_wrapFunction1(otci_CharFlow__init_)],
jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0, 0, jl_Object, [juf_Predicate], 1, 0, 0, ["$_init_68", $rt_wrapFunction1(jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0__init_), "$test1", $rt_wrapFunction1(jusi_SimpleStreamIterator$fetchIfNeeded$lambda$_4_0_test)],
jusi_RangeIntStream, 0, jusi_SimpleIntStreamImpl, [], 1, 0, 0, ["$_init_23", $rt_wrapFunction2(jusi_RangeIntStream__init_), "$next3", $rt_wrapFunction1(jusi_RangeIntStream_next)],
otcit_DoubleSynthesizer, 0, jl_Object, [], 17, 0, () => otcit_DoubleSynthesizer_$callClinit(), 0,
jusi_FlatMappingStreamImpl, 0, jusi_SimpleStreamImpl, [], 1, 0, 0, ["$toList", $rt_wrapFunction0(jus_Stream_toList), "$_init_36", $rt_wrapFunction2(jusi_FlatMappingStreamImpl__init_), "$next0", $rt_wrapFunction1(jusi_FlatMappingStreamImpl_next)],
oajqg_PauliZ, "PauliZ", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_PauliZ__init_)],
otcit_FloatAnalyzer$Result, 0, jl_Object, [], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(otcit_FloatAnalyzer$Result__init_)],
oajqs_SamplingOptions, "SamplingOptions", 14, jl_Object, [], 17, 0, 0, ["$_init_15", $rt_wrapFunction1(oajqs_SamplingOptions__init_0), "$shots", $rt_wrapFunction0(oajqs_SamplingOptions_shots), "$maxWork", $rt_wrapFunction0(oajqs_SamplingOptions_maxWork), "$indexesFor", $rt_wrapFunction1(oajqs_SamplingOptions_indexesFor), "$newRandom", $rt_wrapFunction0(oajqs_SamplingOptions_newRandom)],
jusi_BoxedIntStream$next$lambda$_1_0, 0, jl_Object, [juf_IntPredicate], 1, 0, 0, ["$_init_40", $rt_wrapFunction1(jusi_BoxedIntStream$next$lambda$_1_0__init_), "$test2", $rt_wrapFunction1(jusi_BoxedIntStream$next$lambda$_1_0_test)],
otrr_ClassInfo, 0, otrr_ReflectionInfo, [], 17, 0, 0, ["$newArrayInstance", $rt_wrapFunction1(otrr_ClassInfo_newArrayInstance)],
oajqg_PauliX, "PauliX", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_PauliX__init_)],
otrfm_InMemoryVirtualFileSystem, 0, jl_Object, [otrf_VirtualFileSystem], 1, 0, 0, ["$_init_0", $rt_wrapFunction0(otrfm_InMemoryVirtualFileSystem__init_), "$isWindows", $rt_wrapFunction0(otrfm_InMemoryVirtualFileSystem_isWindows)],
oajqg_PauliY, "PauliY", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_PauliY__init_)],
oajqg_PauliS, "PauliS", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_PauliS__init_)],
oajqg_PauliT, "PauliT", 13, oajqg_Gate, [], 1, 0, 0, ["$_init_6", $rt_wrapFunction1(oajqg_PauliT__init_)],
oajq_QuantumRegister, 0, jl_Object, [], 1, 0, () => oajq_QuantumRegister_$callClinit(), ["$_init_5", $rt_wrapFunction2(oajq_QuantumRegister__init_0), "$_init_31", $rt_wrapFunction3(oajq_QuantumRegister__init_), "$_init_32", $rt_wrapFunction4(oajq_QuantumRegister__init_1), "$getRegisterState", $rt_wrapFunction0(oajq_QuantumRegister_getRegisterState), "$applyOperator", $rt_wrapFunction2(oajq_QuantumRegister_applyOperator), "$applyOperator0", $rt_wrapFunction3(oajq_QuantumRegister_applyOperator0), "$measure", $rt_wrapFunction0(oajq_QuantumRegister_measure),
"$measureQubitAtIndexes", $rt_wrapFunction1(oajq_QuantumRegister_measureQubitAtIndexes), "$reset", $rt_wrapFunction1(oajq_QuantumRegister_reset), "$resetQubitAtIndexes", $rt_wrapFunction1(oajq_QuantumRegister_resetQubitAtIndexes), "$getResult", $rt_wrapFunction0(oajq_QuantumRegister_getResult)],
ju_Arrays$ArrayAsList, "Arrays$ArrayAsList", 2, ju_AbstractList, [ju_RandomAccess, ji_Serializable], 0, 0, 0, ["$forEach", $rt_wrapFunction1(jl_Iterable_forEach), "$spliterator", $rt_wrapFunction0(ju_Collection_spliterator), "$stream", $rt_wrapFunction0(ju_Collection_stream), "$_init_35", $rt_wrapFunction1(ju_Arrays$ArrayAsList__init_), "$get", $rt_wrapFunction1(ju_Arrays$ArrayAsList_get), "$size", $rt_wrapFunction0(ju_Arrays$ArrayAsList_size)],
ju_Collections, 0, jl_Object, [], 17, 0, () => ju_Collections_$callClinit(), 0]);
$rt_enumConstantsMetadata([
    jus_Collector$Characteristics, () => [jus_Collector$Characteristics_CONCURRENT, jus_Collector$Characteristics_UNORDERED, jus_Collector$Characteristics_IDENTITY_FINISH], oajvs_GateKind, () => [oajvs_GateKind_H, oajvs_GateKind_X, oajvs_GateKind_Y, oajvs_GateKind_Z, oajvs_GateKind_S, oajvs_GateKind_T, oajvs_GateKind_CNOT, oajvs_GateKind_CZ, oajvs_GateKind_CY, oajvs_GateKind_SWAP, oajvs_GateKind_CSWAP, oajvs_GateKind_TOFFOLI, oajvs_GateKind_RX, oajvs_GateKind_RY, oajvs_GateKind_RZ, oajvs_GateKind_PHASE, oajvs_GateKind_U3,
    oajvs_GateKind_MULTI_CONTROLLED, oajvs_GateKind_ORACLE, oajvs_GateKind_GENERIC, oajvs_GateKind_MEASUREMENT, oajvs_GateKind_RESET, oajvs_GateKind_IDENTITY], jm_RoundingMode, () => [jm_RoundingMode_UP, jm_RoundingMode_DOWN, jm_RoundingMode_CEILING, jm_RoundingMode_FLOOR, jm_RoundingMode_HALF_UP, jm_RoundingMode_HALF_DOWN, jm_RoundingMode_HALF_EVEN, jm_RoundingMode_UNNECESSARY]]);
let $rt_booleanArrayCls = $rt_arraycls($rt_booleancls),
$rt_charArrayCls = $rt_arraycls($rt_charcls),
$rt_byteArrayCls = $rt_arraycls($rt_bytecls),
$rt_shortArrayCls = $rt_arraycls($rt_shortcls),
$rt_intArrayCls = $rt_arraycls($rt_intcls),
$rt_longArrayCls = $rt_arraycls($rt_longcls),
$rt_doubleArrayCls = $rt_arraycls($rt_doublecls);
$rt_stringPool(["Can\'t enter monitor from another thread synchronously", "Creating gate that affects 2 or more qubits with the same index", "MC", "MultiControlled expects ", " indexes (", " controls + ", " targets), got ", "theta", "phi", "lambda", " gate requires a matrix, but none was provided", "H", "X", "Y", "Z", "S", "T", "I", "M", "RST", "CNot", "CZ", "CY", "Swap", "CSwap", "TOFF", "Rx", "Ry", "Rz", "P", "U3", "Oracle", "Generic Gate", "String is null", "String is empty", "String contains invalid digits: ",
"String contains digits out of radix ", ": ", "The value is too big for int type: ", "The value is too big for integer type", "Illegal radix: ", "GateSpec[", "kind=", ", targets=", ", controls=", ", params=", ", matrix=", "]", "The value is too big for long type: ", "The value is too big for long type", "main", "Zero length BigInteger", "Radix out of range", "Negative bit address", "Negative exponent", "BigInteger divide by zero", "(this Collection)", ", ", "Adding gate that affects a qubit already involved in this circuit level",
"null", "(this Map)", "circuit", "options", "Sampling exceeds the amplitude-visit work budget", "numControls must be >= 1, was: ", "Base operator U must be square", "Base operator U dimension must be a power of two >= 2, was: ", "ComplexMatrix{", "JSON input too large: ", " characters", "root", "version", "numQubits", "levels", "too many levels (max 100000)", "level", "gates", "too many gates (max 100000)", "numQubits out of range (1..", "): ", "gate", "kind", "unknown gate kind: ", "targets", "controls", "params",
"matrix", "control and target overlap on qubit ", " element", "duplicate ", " index: ", " index out of range [0,", "param ", "matrix gate acts on too many qubits: ", "matrix must be ", "x", ", got ", " rows", "matrix row", "matrix row must have ", " columns, got ", "matrix cell", "re", "im", " must be an object", " must be an array", " must be a string", " must be a number", " must be finite", " must be an integer", "Class does not represent enum", "Enum ", " does not have the ", " constant", "CONCURRENT", "UNORDERED",
"IDENTITY_FINISH", "maxQubits must be positive, was: ", "maxQubits must be at most 30, was: ", "maxSearchQubits must be positive, was: ", "maxSearchQubits must be at most 30, was: ", "parallelThreshold must be positive, was: ", "jqapi.parallel.enabled", "jqapi.parallel.threshold", "0", "", "true", "false", "ComplexCell[", "re=", ", im=", "(", ")", "CNOT", "SWAP", "CSWAP", "TOFFOLI", "RX", "RY", "RZ", "PHASE", "MULTI_CONTROLLED", "ORACLE", "GENERIC", "MEASUREMENT", "RESET", "IDENTITY", "interface ", "class ",
"[L", "Either src or dest is null", "java.version", "21", "os.name", "TeaVM", "file.separator", "/", "\\", "path.separator", ":", ";", "line.separator", "java.io.tmpdir", "java.vm.version", "user.home", "/tmp", "\n", "Scale out of range.", "Rounding necessary", "LevelSpec[", "gates=", "power of ten too big", "Infinity", "NaN", "[]", "{\"ok\":true,\"amplitudes\":[", "{\"re\":", ",\"im\":", "]}", "SIMULATION_FAILED", "INPUT_LIMIT_EXCEEDED", "INVALID_CIRCUIT_SPEC", "{\"ok\":true,\"shots\":", ",\"counts\":[", "INVALID_SHOT_COUNT",
"{\"ok\":false,\"error\":{\"code\":\"", "\"}}", "trailing characters", "unexpected end of input", "nesting too deep", "expected \',\' or \'}\'", "expected \',\' or \']\'", "unterminated string", "unescaped control character", "lone low surrogate character", "unterminated escape", "invalid escape \'\\", "\'", "lone high surrogate character", "lone low surrogate escape", "high surrogate escape not followed by a low surrogate", "lone high surrogate escape", "truncated unicode escape", "invalid unicode escape",
"invalid number", "expected digit", "invalid literal", " \t\r\n", "expected \'", "Invalid CircuitSpec JSON at position ", "UP", "DOWN", "CEILING", "FLOOR", "HALF_UP", "HALF_DOWN", "HALF_EVEN", "UNNECESSARY", "Circuit size must be positive, was: ", "Circuit size ", " exceeds maximum allowed qubits (", "Adding gate that affect more qubits than circuit size or qubits out of register indexes", "Sampling work budget must be positive", "randomFactory", "Shots must be in [1, 10000]", "random source", "Measured qubit indexes must be distinct and in range",
"Measured qubits must be nonempty and fit the register", "random", "initialState", "Initial state dimension must equal 2^size", "amplitude", "Initial state must be finite and normalized", "Random source must return a finite value in [0, 1)", "Register size must be positive, was: ", "Register size ", "operator", "targetQubits", "Gate has more targets than register qubits", "Gate matrix of dimension ", " cannot be applied to ", " qubit(s)", "target qubit", "Duplicate target qubit: ", "Target qubit index out of range [0,",
"Reset index ", " out of range [0, ", "Qubit ", " collapsed to a zero-probability branch", "Measurement index "]);
jl_String.prototype.toString = function() {
    return $rt_ustr(this);
};
jl_String.prototype.valueOf = jl_String.prototype.toString;
jl_Object.prototype.toString = function() {
    return $rt_ustr(jl_Object_toString(this));
};
jl_Object.prototype.__teavm_class__ = function() {
    return $dbg_class(this);
};
let $rt_export_main = $rt_mainStarter(oajw_JqapiBridge_main);
$rt_export_main.javaException = $rt_javaException;
let $rt_jso_marker = Symbol('jsoClass');
(() => {
    let c;
})();
export { $rt_export_main as main, oajw_JqapiBridge_run$exported$0 as run, oajw_JqapiBridge_sample$exported$1 as sample };
