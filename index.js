import React from 'react';
import { Plugin } from '@vizality/entities';
import { patch, unpatchAll } from '@vizality/patcher';
import { getModuleByDisplayName } from '@vizality/webpack';
import { sleep } from "@vizality/util/Time"

export default class IssuePopout extends Plugin {
    start () {
        this.injectStyles("style.scss")
        this.patchUSP()
    }

    stop () {
        unpatchAll("issue-popout")
    }

    patchUSP() {
        const dontask = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current
        const bUseMemo = dontask.useMemo
        const bUseState = dontask.useState
        const bUseEffect = dontask.useEffect
        const bUseLayoutEffect = dontask.useLayoutEffect
        const bUseRef = dontask.useRef

        dontask.useMemo = (f) => f()
        dontask.useState = (v) => [v, () => void 0]
        dontask.useEffect = () => null
        dontask.useLayoutEffect = () => null
        dontask.useRef = () => ({})

        const UserPopout = getModuleByDisplayName('ConnectedUserPopout')({ user: { isNonUserBot: () => void 0 } }).type

        dontask.useMemo = bUseMemo
        dontask.useState = bUseState
        dontask.useEffect = bUseEffect
        dontask.useLayoutEffect = bUseLayoutEffect
        dontask.useRef = bUseRef

        patch('issue-usp', UserPopout.prototype, 'render', function (args, res) {
            res.props.children.ref = async dom => {
                if (!dom) return
                await sleep(1)

                let parentDOM = dom.parentElement.parentElement
                let bounding = parentDOM.getBoundingClientRect()
                
                if (parentDOM.offsetTop + bounding.height > window.innerHeight) {
                    parentDOM.className += " issue-usp-fix"
                }
            }
        })
    }
}