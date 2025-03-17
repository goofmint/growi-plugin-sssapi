import React from 'react';

import { h, Properties } from 'hastscript';
import type { Plugin } from 'unified';
import { Node } from 'unist';
import { visit } from 'unist-util-visit';

// import { getReactHooks } from '../react-hooks';

import './Hello.css';

declare const growiFacade : {
  react: typeof React,
};

export const helloGROWI = (Tag: React.FunctionComponent<any>): React.FunctionComponent<any> => {
  return ({ children, ...props }) => {
    try {
      const { react } = growiFacade;
      const { useEffect, useState } = react;
      // 外部データを取得して適用するためのstate
      const [rows, setRows] = useState<{[key: string]: string}[]>([]);
      const [headers, setHeaders] = useState<string[]>([]);
      const [detail, setDetail] = useState<{[key: string]: string} | null>(null);
      const getData = async(url: string) => {
        const response = await fetch(url);
        const json = await response.json();
        setRows(json);
        setHeaders(Object.keys(json[0] || {}));
      };
      const { sssapi, show } = JSON.parse(props.title);
      if (sssapi) {
        const { href } = props;
        useEffect(() => {
          getData(href);
        }, [href]);
        const displayFields = show ? show.split(',') : [];
        return (
          <>
            <table className='table'>
              <thead>
                <tr>
                  {headers.map(header => (
                    (displayFields.length > 0 && !displayFields.includes(header)) ? null
                      : <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => setDetail(row)}
                  >
                    {headers.map(header => (
                      (displayFields.length > 0 && !displayFields.includes(header)) ? null
                        : <td key={header}>{row[header]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {detail && (
              <div>
                <ul>
                  {Object.entries(detail).map(([key, value]) => (
                    <li key={key}>{key}:<br />
                      {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        );
      }
    }
    catch (err) {
      // console.error(err);
    }
    // Return the original component if an error occurs
    return (
      <Tag {...props}>{children}</Tag>
    );
  };
};

interface GrowiNode extends Node {
  name: string;
  data: {
    hProperties?: Properties;
    hName?: string;
    hChildren?: Node[] | { type: string, value: string, url?: string }[];
    [key: string]: any;
  };
  type: string;
  attributes: {[key: string]: string}
  children: GrowiNode[] | { type: string, value: string, url?: string }[];
  value: string;
  title?: string;
  url?: string;
}


export const remarkPlugin: Plugin = () => {
  return (tree: Node) => {
    // You can use 2nd argument for specific node type
    // visit(tree, 'leafDirective', (node: Node) => {
    // :plugin[xxx]{hello=growi} -> textDirective
    // ::plugin[xxx]{hello=growi} -> leafDirective
    // :::plugin[xxx]{hello=growi} -> containerDirective
    visit(tree, (node: Node) => {
      const n = node as unknown as GrowiNode;
      if (n.name !== 'sssapi') return;
      const data = n.data || (n.data = {});
      // Render your component
      const { url } = n.children[0] || { url: '' };
      data.hName = 'a'; // Tag name
      data.hChildren = []; // Children
      // Set properties
      data.hProperties = {
        href: url,
        title: JSON.stringify({ ...n.attributes, ...{ sssapi: true } }), // Pass to attributes to the component
      };
    });
  };
};
