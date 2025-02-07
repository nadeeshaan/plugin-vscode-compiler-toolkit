"use strict";
/**
 * Copyright (c) 2021, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */

import { expect } from "chai";
import * as _ from "lodash";
import * as path from "path";
import { commands, Position, Selection, Uri } from "vscode";
import { ExtendedLangClient } from "../../src/core/extended-language-client";
import { getServerOptions } from "../../src/server/server";
import { getBallerinaCmd } from "../test-util";

export let fullResponseTree: any;
export let locateResponseTree: any;

suite("Language Server Tests", function() {
    this.timeout(15000);
    let langClient: ExtendedLangClient;

    const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
    const DATA_ROOT = path.join(PROJECT_ROOT, "test", "resources");

    suiteSetup((done: MochaDone): any => {
        langClient = new ExtendedLangClient(
            "ballerina-compiler-toolkit",
            "Ballerina Compiler Toolkit LS Client",
            getServerOptions(getBallerinaCmd()),
            { documentSelector: [{ scheme: "file", language: "ballerina" }] },
            false
        );
        langClient.start();
        done();
    });


    test("Test Language Server Start", function(done): void {
        langClient.onReady().then(() => {
            done();
        }, () => {
            done(new Error("Language Server start failed"));
        }).catch((err) => {
            done(new Error("Language Server start failed"));
        });
    });

    test("Test getSyntaxTree", function(done): void {
        const uri = Uri.file(path.join(DATA_ROOT, "source1.bal"));
        commands.executeCommand("vscode.open", uri).then(() => {
            langClient.onReady().then(() => {
                langClient.getSyntaxTree(uri).then((response) => {
                    Promise.resolve(response);
                    expect(response).to.contain.keys("syntaxTree", "parseSuccess");
                    if (response.syntaxTree) {
                        fullResponseTree = _.cloneDeep(response);
                        expect(response.syntaxTree.kind).to.equal("ModulePart");
                    }
                    done();
                }, (reason) => {
                    done(reason);
                });
            });
        });
    });

    test("Test getSyntaxTreeByRange", function(done): void {
        const uri = Uri.file(path.join(DATA_ROOT, "source1.bal"));
        commands.executeCommand("vscode.open", uri).then(() => {
            langClient.onReady().then(() => {
                const range = new Selection(new Position(4, 4), new Position(4,32));
                langClient.getSyntaxTreeByRange(uri, range).then((response) => {
                    Promise.resolve(response);
                    expect(response).to.contain.keys("syntaxTree", "parseSuccess");
                    if (response.syntaxTree) {
                        expect(response.syntaxTree.kind).to.equal("CallStatement");
                    }
                    done();
                }, (reason) => {
                    done(reason);
                });
            });
        });
    });

    test("Test getSyntaxNodePath", function(done): void {
        const uri = Uri.file(path.join(DATA_ROOT, "source2.bal"));
        commands.executeCommand("vscode.open", uri).then(() => {
            langClient.onReady().then(() => {
                const range = new Selection(new Position(0, 7), new Position(0,16));
                langClient.getSyntaxNodePath(uri, range).then((response) => {
                    Promise.resolve(response);
                    locateResponseTree = _.cloneDeep(response);
                    expect(locateResponseTree.syntaxTree.isNodePath).to.equal(true);
                    done();
                }, (reason) => {
                    done(reason);
                });
            });
        });
    });

    // test("Test syntaxApiCalls", function (done): void {
    //     const uri = Uri.file(path.join(DATA_ROOT, 'source3.bal'));
    //     commands.executeCommand('vscode.open', uri).then(() => {
    //         langClient.onReady().then(() => {
    //             langClient.getSyntaxApiCalls(uri).then((response) => {
    //                 Promise.resolve(response);
    //                 expect(response).to.contain.keys('source', 'code', 'parseSuccess');
    //                 expect(response.code).to.contain("NodeFactory.createModulePartNode");
    //                 done();
    //             }, (reason) => {
    //                 done(reason);
    //             });
    //         });
    //     });
    // });

    test("Test Language Server Stop", (done) => {
        langClient.stop().then(() => {
            done();
        }, () => {
            done(new Error("Language Server stop failed"));
        });
    });
});
