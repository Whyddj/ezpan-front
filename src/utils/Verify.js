const regs = {
    email : /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
    number : /^[0-9]*$/,
    password : /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/,
    shareCode : /^[a-zA-Z0-9]{5}$/
}
const Verify = (rule, value, reg, callback) => {
    if (value) {
        if (reg.test(value)) {
            callback()
        } else {
            callback(new Error(rule.message))
        }
    } else {
        callback()
    }
}

export default {
    email: (rule, value, callback) => {
        Verify(rule, value, regs.email, callback)
    },
    number: (rule, value, callback) => {
        Verify(rule, value, regs.number, callback)
    },
    password: (rule, value, callback) => {
        Verify(rule, value, regs.password, callback)
    },
    shareCode: (rule, value, callback) => {
        Verify(rule, value, regs.shareCode, callback)
    }
}
