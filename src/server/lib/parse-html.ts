import render from 'dom-serializer'
import { ElementType } from 'domelementtype'
import { ChildNode, Element, Text } from 'domhandler'
import { DomHandler, DomUtils, Parser } from 'htmlparser2'

import { INodes } from '../../lib/types'
import { printAndExit } from './utils'

interface AddTagsOptions {
  isPrepend?: boolean
}

export default class ParseHtml {
  private _originDom!: ChildNode[]
  private _dom!: ChildNode[]

  constructor(source: string) {
    const parser = new Parser(
      new DomHandler((error, dom) => {
        if (error) {
          printAndExit(`> Failed to parse html`)
        }
        this._originDom = dom
        this.restoreDom()
      }),
    )
    parser.write(source)
    parser.end()
  }

  public deleteById(id: string) {
    const idDom = DomUtils.getElementById(id, this._dom)
    if (idDom) {
      DomUtils.removeElement(idDom)
    }
  }

  public deleteByTag(tagName: string) {
    const scriptDoms = DomUtils.getElementsByTagName(tagName, this._dom)
    scriptDoms.map(ele => DomUtils.removeElement(ele))
  }

  public restoreDom() {
    this._dom = this._originDom.map(item => item.cloneNode(true))
  }

  public headAddTags(nodes: INodes, options?: AddTagsOptions) {
    const heads = DomUtils.getElementsByTagName('head', this._dom)
    const head = heads[0]
    if (head) {
      this.addTags(nodes, head, options)
    }
  }

  public bodyAddTags(nodes: INodes, options?: AddTagsOptions) {
    const bodys = DomUtils.getElementsByTagName('body', this._dom)
    const body = bodys[0]
    if (body) {
      this.addTags(nodes, body, options)
    }
  }

  public addTags(nodes: INodes, target: Element, options: AddTagsOptions = {}) {
    const { isPrepend } = options
    nodes.forEach(node => {
      const { tagName, children, attribs = {} } = node
      let element: ChildNode

      if (tagName) {
        element = new Element(
          tagName,
          attribs,
          [typeof children === 'string' ? new Text(children) : children],
          tagName === 'script'
            ? ElementType.Script
            : tagName === 'style'
            ? ElementType.Style
            : ElementType.Tag,
        )
      } else {
        element = new Text(children)
      }

      if (isPrepend) {
        DomUtils.prependChild(target, element)
      } else {
        DomUtils.appendChild(target, element)
      }
    })
  }

  public serializer() {
    return render(this._dom, { decodeEntities: false })
  }
}
