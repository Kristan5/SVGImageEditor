// Put all onload AJAX calls here, and event listeners
$(document).ready(function() {
    $.ajax({
        type: 'get',
        url: '/loggedIn',   
        success: function (loggedInData) {
            if (loggedInData.result){
                destroyLoginPopup();
            }
            else if (!loggedInData.result){
                createLoginPopup();
                $('#loginForm').submit(function(e){
                    let host = $('#dbNameInput').val();
                    let username = $('#usernameInput').val();
                    let password = $('#passwordInput').val();
                    // e.preventDefault();
                    $.ajax({
                        type: 'get',
                        url: '/connectToDB',   
                        data: {
                            host: host,
                            username: username,
                            password: password
                        },
                        success: function (connectionResult) {
                            // If Connected to database successfully, then remove popup
                            if (connectionResult.result){
                                destroyLoginPopup();
                            }
                            else {
                                alert("Failed to Connect, please enter valid Credentials");
                            }
                        },
                        fail: function(error) {
                            console.log(error); 
                        }
                    });
                });

            }
        },
        fail: function(error) {
            console.log(error); 
        }
    });

    $('#logout').submit(function(e){
        $.ajax({
            type: 'get',
            url: '/logout',
            success: function (logoutData) {
                if (!logoutData.logOutStatus){
                    // alert("Logged Out");
                }
                else{
                    alert("Did not log out");
                }
            },
            fail: function(error) {
                console.log(error); 
            }
        });
    });

    // When user wants to store all the files currently in the File log panel
    $('#storeDBFiles').submit(function(e){
        e.preventDefault();
        $.ajax({
            type: 'post',
            // dataType: 'json',
            url: '/storeDBFiles',
            success: function (storedStatus) {

            },
            fail: function(error) {
                console.log(error); 
            }
        });
    });

    // Alerts if file was not uploaded successfully 
    $.ajax({
        type: 'post',
        // dataType: 'json',
        url: '/upload',   
        success: function (uploadData) {
            alert(uploadData.alert);
        },
        fail: function(error) {
            console.log(error); 
        }
    });

    // Display DB status 
    $('#displayStatusForm').submit(function(e){
        e.preventDefault();
        $.ajax({
            type: 'get',
            url: '/getDBStatus',
            success: function (dbStatus) {
                alert(dbStatus.status);
            },
            fail: function(error) {
                console.log(error); 
            }
        });
    });

    // Clear all Data
    $('#clearAllData').submit(function(e){
        e.preventDefault();
        $.ajax({
            type: 'post',
            url: '/clearData',
            success: function (clearedData) {
            },
            fail: function(error) {
                console.log(error); 
            }
        });
    });

    // Creates the File Log Panel
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: '/getFiles',   //The server endpoint we are connecting to
        success: function (data) {
            createH4Element("File Log Panel:", "FileLogHeader");
            createFileTable(data.filesArray);
            // $('a[id="imgHrefDownload"]').click(function(e){
            //     // alert("clicked");
            //     let filename = $(this).attr('href');
            //     alert(filename);
            //     $.ajax({
            //         type: 'get',
            //         url: '/downloadRequest',
            //         data: {
            //             theFile: filename
            //         },
            //         success: function (downloadData) {

            //         },
            //         fail: function(error) {
            //             console.log(error); 
            //         }
            //     });
            // }); 
        
            // createH4Element("File Log Panel:", "FileLogHeader");

        },
        fail: function(error) {
            // Non-200 return, do something with error
            $('#blah').html("On page this break load, received error from server");
            console.log(error); 
        }
    });
    // Drop down menu for the user to select which file they want to see the 
    // description and summary of in the svg view panel 
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: '/dropDownMenu',   //The server endpoint we are connecting to
        success: function (data) {
            createH4Element("SVG View Panel:", "selectFileHeader");
            createDropDownMenu(data.fileList, 'svgFileView', "Select File to View");
            // This gets the new value for the drop down for every time that it is changed
            $('#svgFileView').change(function(e){
                // alert($(this).val());
                e.preventDefault();
                // Creates the Svg View panel from the selected file
                let theFile = $(this).val();
                $.ajax({
                    type: 'get',            //Request type
                    dataType: 'json',       //Data type - we will use JSON for almost everything 
                    url: '/svgViewPanel',   //The server endpoint we are connecting to
                    data: {
                        fileName: theFile   //The File to make the svg view panel for 
                    },         
                    success: function (data) {
                        // Creating table
                        createSVGViewPanel(data.SVGArray);

                        $.ajax({
                            type: 'get',            //Request type
                            dataType: 'json',       //Data type - we will use JSON for almost everything 
                            url: '/svgViewPanel',   //The server endpoint we are connecting to
                            data: {
                                fileName: theFile   //The File to make the svg view panel for 
                            },         
                            success: function (secondData) {
                                createDropDownMenu(secondData.SVGchildren, "chooseChild", "Choose Child");
                                // Upon change of drop down menu
                                $('#chooseChild').change(function(e){
                                    e.preventDefault();
                                    let chosenShape = $(this).val();
                                    // Extracts numbers
                                    let shapeIndex = chosenShape.match(/\d+/)[0] -1;
                                    // Extracts letters
                                    let shapeChild = chosenShape.match(/[a-zA-Z]+/g);
                                    // Creates the Svg View panel from the selected file
                                    $.ajax({
                                        type: 'get',            //Request type
                                        dataType: 'json',       //Data type - we will use JSON for almost everything 
                                        url: '/getShapeAttributes',   //The server endpoint we are connecting to
                                        data: {
                                            fileName: theFile,   //The File to make the svg view panel for 
                                            indexNum: shapeIndex,
                                            chosenShape: shapeChild
                                        },         
                                        success: function (thirdData) {

                                            
                                            createDropDownMenu(thirdData.attributeNamesArray, "chooseAttr", "Choose Attribute");
                                            // Entry box to add new attribute to shape
                                            createEntryBox("", "addAttribute", "addAttributeForm", "AddAttribute");
                                            
                                            // To add a new Attribute to the currently selected shape
                                            $('#addAttributeForm').submit(function(e){
                                                let newAttribute = $("#AddAttribute").val();
                                                // e.preventDefault();
                                                //Pass data to the Ajax call, so it gets passed to the server
                                                $.ajax({
                                                    type: 'get',            //Request type
                                                    dataType: 'json',       //Data type - we will use JSON for almost everything 
                                                    url: '/updateAttribute',   //The server endpoint we are connecting to
                                                    data: {
                                                        chosenShape: shapeChild,
                                                        shapeIndex: shapeIndex,
                                                        name: newAttribute,
                                                        value: "",
                                                        fileName: theFile
                                                    },         
                                                    success: function (editAttributeData) {
                                                        // alert("reloading");
                                                        // location.reload();
                                                    },
                                                    fail: function(error) {
                                                        alert("failed");
                                                        console.log(error); 
                                                    }

                                                });
                                            });


                                            let attrValueArray = thirdData.attributeValuesArray;
                                            // When client changes the attribute name selex box
                                            $('#chooseAttr').change(function(e){
                                                e.preventDefault();
                                                let chosenAttribute = $(this).val();
                                                // Extracts letters
                                                let chosenAttributeType = chosenAttribute.match(/[a-zA-Z]+/g);
                                                // Extracts numbers
                                                let attrIndex = chosenAttribute.match(/\d+/)[0] -1;
                                                // Creates the Svg View panel from the selected file
                                                $.ajax({
                                                    type: 'get',            //Request type
                                                    dataType: 'json',       //Data type - we will use JSON for almost everything 
                                                    url: '/getAttrAtIndex',   //The server endpoint we are connecting to
                                                    data: {
                                                        chosenAttrIndex: attrIndex,
                                                        valueArray: attrValueArray
                                                    },         
                                                    success: function (fourthData) {
                                                        let initialValue = fourthData.attrValue;
                                                        createEntryBox(initialValue, "editAttribute", "EditAttributeForm", "EditAttribute");
                                                        // For when user submits form after change
                                                        $('#EditAttributeForm').submit(function(e){
                                                            let updatedValue = $("#EditAttribute").val();
                                                            // e.preventDefault();
                                                            //Pass data to the Ajax call, so it gets passed to the server
                                                            $.ajax({
                                                                type: 'get',            //Request type
                                                                dataType: 'json',       //Data type - we will use JSON for almost everything 
                                                                url: '/updateAttribute',   //The server endpoint we are connecting to
                                                                data: {
                                                                    chosenShape: shapeChild,
                                                                    shapeIndex: shapeIndex,
                                                                    name: chosenAttributeType,
                                                                    value: updatedValue,
                                                                    fileName: theFile
                                                                },         
                                                                success: function (editAttributeData) {
                                                                    alert(editAttributeData.alert);
                                                                    // alert("reloading");
                                                                    // location.reload();
                                                                },
                                                                fail: function(error) {
                                                                    alert("failed");
                                                                    console.log(error); 
                                                                }

                                                            });
                                                        });
                                                    },
                                                    fail: function(error) {
                                                        console.log(error); 
                                                    }
                                                });
                                            })
                                            //



                                            // console.log(thirdData.attributeMainNames);
                                            createDropDownMenu(thirdData.attributeMainNames, "chooseMainAttr", "Choose Main Attribute");

                                            let attrMainValueArray = thirdData.attributeMainValues;
                                            // When client changes the attribute name selex box
                                            $('#chooseMainAttr').change(function(e){
                                                e.preventDefault();
                                                let chosenMainAttribute = $(this).val();
                                                // Extracts letters
                                                let chosenMainAttributeType = chosenMainAttribute.match(/[a-zA-Z]+/g);
                                                $.ajax({
                                                    type: 'get',            //Request type
                                                    dataType: 'json',       //Data type - we will use JSON for almost everything 
                                                    url: '/getMainAttrValue',   //The server endpoint we are connecting to
                                                    data: {
                                                        chosen: chosenMainAttributeType,
                                                        chosenShape: shapeChild,
                                                        array: attrMainValueArray
                                                    },         
                                                    success: function (fourthData) {
                                                        let initialValue = fourthData.mainAttrValue;
                                                        createEntryBox(initialValue, "editMainAttribute", "EditMainAttributeForm", "EditMainAttribute");
                                                        
                                                        // For when user submits form after change
                                                        $('#EditMainAttributeForm').submit(function(e){
                                                            let updatedMainValue = $("#EditMainAttribute").val();
                                                            // e.preventDefault();
                                                            //Pass data to the Ajax call, so it gets passed to the server
                                                            $.ajax({
                                                                type: 'get',            //Request type
                                                                dataType: 'json',       //Data type - we will use JSON for almost everything 
                                                                url: '/updateAttribute',   //The server endpoint we are connecting to
                                                                data: {
                                                                    chosenShape: shapeChild,
                                                                    shapeIndex: shapeIndex,
                                                                    name: chosenMainAttributeType,
                                                                    value: updatedMainValue,
                                                                    fileName: theFile
                                                                },         
                                                                success: function (editMainAttributeData) {
                                                                    alert(editMainAttributeData.alert);
                                                                    // alert("reloading");
                                                                    // location.reload();
                                                                    // alert("Updated");
                                                                },
                                                                fail: function(error) {
                                                                    console.log(error); 
                                                                }

                                                            });
                                                        });
                                                    },
                                                    fail: function(error) {
                                                        console.log(error); 
                                                    }
                                                });
                                            })





                                        },
                                        fail: function(error) {
                                            console.log(error); 
                                        }
                                    });
                                })
                                // Description
                                if (secondData.SVGDescription == undefined){
                                    secondData.SVGDescription = "No Description";
                                }
                                // alert(secondData.description);
                                createEntryBox(secondData.SVGDescription, "editDescription", "editDescriptionForm", "editDescriptionID");
                                $('#editDescriptionForm').submit(function(a){
                                    let updatedDescription = $("#editDescriptionID").val();
                                    // a.preventDefault();
                                    if (updatedDescription.length > 256){
                                        alert("Please enter a title that is less than 256 characters");
                                    }
                                    else {
                                        //Pass data to the Ajax call, so it gets passed to the server
                                        $.ajax({
                                            type: 'get',            //Request type
                                            dataType: 'json',       //Data type - we will use JSON for almost everything 
                                            url: '/setDescription',   //The server endpoint we are connecting to
                                            data: {
                                                newDescription: updatedDescription,
                                                fileName: theFile
                                            },         
                                            success: function (descData) {
                                                // alert("Updated");
                                            },
                                            fail: function(error) {
                                                console.log(error); 
                                            }
                                        });
                                    }
                                });
                                // Title
                                if (secondData.SVGTitle == undefined){
                                    secondData.SVGTitle = "No Title";
                                }
                                // alert(secondData.title);
                                createEntryBox(secondData.SVGTitle, "editTitle", "editTitleForm", "editTitleID");
                                $('#editTitleForm').submit(function(e){
                                    let updatedTitle = $("#editTitleID").val();
                                    // e.preventDefault();
                                    if (updatedTitle.length > 256){
                                        alert("Please enter a title that is less than 256 characters");
                                    }
                                    else {
                                        //Pass data to the Ajax call, so it gets passed to the server
                                        $.ajax({
                                            type: 'get',            //Request type
                                            dataType: 'json',       //Data type - we will use JSON for almost everything 
                                            url: '/setTitle',   //The server endpoint we are connecting to
                                            data: {
                                                newTitle: updatedTitle,
                                                fileName: theFile
                                            },         
                                            success: function (titleData) {
                                                // alert("Updated");
                                            },
                                            fail: function(error) {
                                                console.log(error); 
                                            }

                                        });
                                    }
                                });

                            },
                            fail: function(error) {
                                // Non-200 return, do something with error
                                console.log(error); 
                            }
                        });

                    },
                    fail: function(error) {
                        // Non-200 return, do something with error
                        console.log(error); 
                    }
                });


            })
        },
        fail: function(error) {
            // Non-200 return, do something with error
            console.log(error); 
        }
    });

    // Editing an SVG image
    $.ajax({
        type: 'get',            //Request type
        dataType: 'json',       //Data type - we will use JSON for almost everything 
        url: '/dropDownMenu',   //The server endpoint we are connecting to
        success: function (data) {
            createDropDownMenu(data.fileList, 'chooseSVGEdit', "Choose SVG to Edit");

            // Choose SVG to Edit
            $('#chooseSVGEdit').change(function(e){
                // $('#blah').html("Form has data: "+$('#entryBox').val());
                let fileName = $(this).val();
                e.preventDefault();
                //Pass data to the Ajax call, so it gets passed to the server
                let shapeArray = circRectArray();
                createDropDownMenu(shapeArray,'selectShape', "Choose Shape");
                createDropDownMenu(shapeArray, 'scaleShape', "Choose Shape to Scale");

                // Select shape to Add
                $('#selectShape').change(function(e){
                    // $('#blah').html("Form has data: "+$('#entryBox').val());
                    e.preventDefault();
                    let selectedShape = $('#selectShape').val();
                    addShapePanel(selectedShape);
                    //Pass data to the Ajax call, so it gets passed to the server

                    // When user submits a shape to be added
                    $('#addShapeForm').submit(function(e){
                        // alert("alerting");
                        // $('#blah').html("Form has data: "+$('#entryBox').val());
                        // e.preventDefault();
                        if (selectedShape == "Circle"){
                            let cx = $('#cxID').val();
                            let cy = $('#cyID').val();
                            let r = $('#rID').val();
                            let units = $('#unitID').val();
                            let fill = $('#fillID').val();

                            $.ajax({
                                type: 'get',
                                dataType: 'json',    
                                url: '/addCircle',   
                                data:{
                                    cx:cx,
                                    cy:cy,
                                    r:r,
                                    units:units,
                                    fill:fill,
                                    fileName:fileName
                                },
                                success: function (addCircleData) {
                                    alert(addCircleData.alert);
                                },
                                fail: function(error) {
                                    console.log(error); 
                                }
                            });
                        }
                        else if (selectedShape == "Rectangle"){
                            let x = $('#xID').val();
                            let y = $('#yID').val();
                            let w = $('#wID').val();   
                            let h = $('#hID').val();
                            let units = $('#unitID').val();
                            let fill = $('#fillID').val();

                            $.ajax({
                                type: 'get',
                                dataType: 'json',    
                                url: '/addRectangle',
                                data: {
                                    x:x,
                                    y:y,
                                    w:w,
                                    h:h,
                                    units:units,
                                    fill:fill,
                                    fileName:fileName
                                },
                                success: function (addRectangleData) {
                                    alert(addRectangleData.alert);
                                },
                                fail: function(error) {
                                    console.log(error); 
                                }
                            });
                        }
                    });
                });

                // Scale Shape
                $('#scaleShape').change(function(e){
                    e.preventDefault();
                    let selectedShape = $('#scaleShape').val();
                    scaleFactorSlider();
                    // When user submits a shape to be added
                    $('#scaleShapeForm').submit(function(e){
                        // alert("alerting");
                        let scaleFactor = $("#shapeScaler").val();
                        // $('#blah').html("Form has data: "+$('#entryBox').val());
                        // e.preventDefault();
                        if (selectedShape == "Circle"){
                            // CREATE SLIDER TO GET SCALE VALUEs
                            $.ajax({
                                type: 'get',
                                dataType: 'json',    
                                url: '/scaleCircle',   
                                data:{
                                    scaleFactor:scaleFactor,
                                    fileName:fileName
                                },
                                success: function (addCircleData) {
                        
                                },
                                fail: function(error) {
                                    console.log(error); 
                                }
                            });
                        }
                        else if (selectedShape == "Rectangle"){
                            // CREATE SLIDER TO GET SCALE VALUEs
                            $.ajax({
                                type: 'get',
                                dataType: 'json',    
                                url: '/scaleRectangle',
                                data: {
                                    scaleFactor:scaleFactor,
                                    fileName:fileName
                                },
                                success: function (addRectangleData) {

                                },
                                fail: function(error) {
                                    console.log(error); 
                                }
                            });
                        }
                    });


                });



            });



        },
        fail: function(error) {
            console.log(error); 
        }
    });




    // To Create a new SVG
    $('#createSVGForm').submit(function(e){
        let newFileName = $('#newSVGName').val();
        let title = $('#newTitle').val();
        let description = $('#newDescription').val();
        $.ajax({
            type: 'get',            
            dataType: 'json',       
            url: '/createSVGImage',
            data: {
                fileName: newFileName,
                title: title,
                description: description
            },
            success: function (creationData) {
                alert(creationData.alert);
                // alert(creationData.status);
            },
            fail: function(error) {
                console.log(error); 
            }
        });
    });

//     // Update Image Properties
//     $.ajax({
//         type: 'get',            //Request type
//         dataType: 'json',       //Data type - we will use JSON for almost everything 
// // NEED TO CHANGE THIS TO THE APPROPRIATE SERVER ENDPOINT
//         url: '/getFiles',   //The server endpoint we are connecting to
//         success: function (data) {
//             // createH4Element("Update/ Edit Image Properties:", "updateSVGPropertiesHeader");
//             // createFileTable(data.filesArray);
//         },
//         fail: function(error) {
//             // Non-200 return, do something with error
//             $('#blah').html("On page this break load, received error from server");
//             console.log(error); 
//         }
//     });

    $('a[id="queryOption"]').click(function(e){
        e.preventDefault();
        let choice = $(this).attr('href');
        if (choice == 'allFiles'){
            // Creates array that will be used for table
            // Sends back sorted arrays for each of the search types (name and file size)
            let sortType = ["File Size", "File Name"];
            clearQueryForInfo();
            setQueryTitle("All Files");
            createNewDropDownMenu(sortType, "allFileSort", "Sort by:");
            let sort = "default";
            $('#allFileSort').change(function(e){
                e.preventDefault();
                document.getElementById("queryTable").innerHTML = "";
                sort = $(this).val();
                allFilesQueryAjax(sort);                
            });
            allFilesQueryAjax(sort);

        } else if (choice == 'allFilesDate'){
            let sortType = ["File Size", "File Name", "Creation Date"];
            clearQueryForInfo();
            setQueryTitle("Files in Time Period");
            createNewDropDownMenu(sortType, "allDateSort", "Sort by:");
            createDateRange("allFilesDateForm");
            let sort = "default";
            $('#allFilesDateForm').submit(function(e){
                e.preventDefault();
                let beginDate = $("#beginDate").val();
                let endDate = $("#endDate").val();
                
                $('#allDateSort').change(function(e){
                    e.preventDefault();
                    document.getElementById("queryTable").innerHTML = "";
                    sort = $(this).val();
                    beginDate = $("#beginDate").val();
                    endDate = $("#endDate").val();
                    allFilesQueryAjaxDate(sort, beginDate, endDate);
                });
                allFilesQueryAjaxDate(sort, beginDate, endDate);
            });

        } else if (choice == 'modifiedFiles'){
            // In table Must include Columns: 
            /* FILE NAME || MOST RECENT MODIFICATION DATE || NUMBER OF CHANGES MADE TO THE FILE DURING THAT TIME || FILE SIZE */
            let sortType = ["File Size", "File Name", "Most Recently Modified"];
            clearQueryForInfo()
            setQueryTitle("Modified Files");
            createNewDropDownMenu(sortType, "modSort", "Sort by:");
            createDateRange("ModifiedDateForm");
            let sort = "default";
            $('#ModifiedDateForm').submit(function(e){
                e.preventDefault();
                let beginDate = $("#beginDate").val();
                let endDate = $("#endDate").val();
                
                $('#modSort').change(function(e){
                    e.preventDefault();
                    document.getElementById("queryTable").innerHTML = "";
                    sort = $(this).val();
                    beginDate = $("#beginDate").val();
                    endDate = $("#endDate").val();
                    modifiedFilesQueryAjax(sort, beginDate, endDate);
                });
                modifiedFilesQueryAjax(sort, beginDate, endDate);
            });
        } else if (choice == 'specificShape'){
            let sortType = ["File Size", "File Name", "Shape Count"];
            clearQueryForInfo();
            setQueryTitle("Specific Shape Counts");
            createNewDropDownMenu(sortType, "specSort", "Sort by:");
            createShapeCount();
            let sort = "default";
            $('#shapeCountForm').submit(function(e){
                e.preventDefault();
                let shape = $("#selectShapeForCount").val();
                let shapeRange1 = $("#shapeRange1").val();
                let shapeRange2 = $("#shapeRange2").val();
                
                $('#specSort').change(function(e){
                    e.preventDefault();
                    document.getElementById("queryTable").innerHTML = "";
                    sort = $(this).val();
                    shape = $("#selectShapeForCount").val();
                    shapeRange1 = $("#shapeRange1").val();
                    shapeRange2 = $("#shapeRange2").val();
                    specificShapeAjaxQuery(sort, shape, shapeRange1, shapeRange2);
                });
                specificShapeAjaxQuery(sort, shape, shapeRange1, shapeRange2);
            });
        } else if (choice == 'mostDownloaded'){
            // N MOST FREQUENTLY DOWNLOADED FILE || SUMMARY || DOWNLOAD COUNT
            let sortType = ["File Name", "Download Count"];
            clearQueryForInfo();
            setQueryTitle("Frequently Downloaded Files");
            createNewDropDownMenu(sortType, "downloadSort", "Sort by:");
            getN();
            let sort = "default";
            $('#getNForm').submit(function(e){
                e.preventDefault();
                let n = $("#nInput").val();

                $('#downloadSort').change(function(e){
                    e.preventDefault();
                    document.getElementById("queryTable").innerHTML = "";
                    sort = $(this).val();
                    n = $("#nInput").val();
                    mostDownloadedAjaxQuery(sort, n);
                });
                mostDownloadedAjaxQuery(sort, n);
            });

        } else if (choice == 'specificChange'){
            let sortType = ["Change Type", "Recent Change First", "Recent Change Last"];
            clearQueryForInfo();
            setQueryTitle("Specific Change");
            createNewDropDownMenu(sortType, "specificChangeSort", "Sort by:");
            createDateRange("specificChangeForm");
            let sort = "default";
            $('#specificChangeForm').submit(function(e){
                e.preventDefault();
                let beginDate = $("#beginDate").val();
                let endDate = $("#endDate").val();
                
                $('#specificChangeSort').change(function(e){
                    e.preventDefault();
                    document.getElementById("queryTable").innerHTML = "";
                    sort = $(this).val();
                    beginDate = $("#beginDate").val();
                    endDate = $("#endDate").val();
                    specificChangeQueryAjax(sort, beginDate, endDate);
                });
                specificChangeQueryAjax(sort, beginDate, endDate);
            });

        }
    }); 



});

function setQueryTitle(title){
    document.getElementById("queryTitle").innerHTML = "";
    document.getElementById("queryTitle").appendChild(document.createTextNode(title));
}

function clearQueryForInfo(){
    // document.getElementById("querySort").innerHTML = "";
    document.getElementById("tempQuery").innerHTML = "";
    document.getElementById("queryTable").innerHTML = "";
    // document.getElementById("getNForm").innerHTML = "";
    // document.getElementById("shapeCountForm").innerHTML = "";
    // document.getElementById("dateRangeForm").innerHTML = "";
}

function createDatabaseTable(data){
    document.getElementById("queryTable").innerHTML = "";
    var table = document.getElementById('queryTable');
    var tableBody = document.createElement('tbody');
    
    data.forEach(function(rowData) {
        var row = document.createElement('tr');
    
        rowData.forEach(function(cellData) {
        var cell = document.createElement('td');
        cell.appendChild(document.createTextNode(cellData));
        row.appendChild(cell);
        });
    
        tableBody.appendChild(row);
    });
    
    table.appendChild(tableBody);
    document.body.appendChild(table);
}
function allFilesQueryAjax(sort){
    $.ajax({
        type: 'get',
        url: '/allFilesQuery',
        data:{
            sort:sort
        },
        success: function (allFilesData) {
            createDatabaseTable(allFilesData.array);
        },
        fail: function(error) {
            console.log(error); 
        }
    });
}
function allFilesQueryAjaxDate(sort, beginDate, endDate){
    $.ajax({
        type: 'get',
        url: '/allFilesQuery',
        data:{
            sort:sort,
            beginDate:beginDate,
            endDate:endDate
        },
        success: function (allFilesData) {
            createDatabaseTable(allFilesData.array);
        },
        fail: function(error) {
            console.log(error); 
        }
    });
}
function modifiedFilesQueryAjax(sort, beginDate, endDate){
    $.ajax({
        type: 'get',
        url: '/modifiedFilesQuery',
        data:{
            sort:sort,
            beginDate:beginDate,
            endDate:endDate
        },
        success: function (allFilesData) {
            createDatabaseTable(allFilesData.array);
        },
        fail: function(error) {
            console.log(error); 
        }
    });
}

function specificShapeAjaxQuery(sort, shape, shapeRange1, shapeRange2){
    $.ajax({
        type: 'get',
        url: '/specificShapeQuery',
        data:{
            sort:sort,
            shapeRange1: shapeRange1,
            shapeRange2: shapeRange2,
            shape: shape,
        },
        success: function (allFilesData) {
            createDatabaseTable(allFilesData.array);
        },
        fail: function(error) {
            console.log(error); 
        }
    });
}

function mostDownloadedAjaxQuery(sort, n){
    $.ajax({
        type: 'get',
        url: '/mostDownloadedQuery',
        data:{
            sort:sort,
            n:n
        },
        success: function (allFilesData) {
            createDatabaseTable(allFilesData.array);
        },
        fail: function(error) {
            console.log(error); 
        }
    });  
}
function specificChangeQueryAjax(sort, beginDate, endDate){
    $.ajax({
        type: 'get',
        url: '/specificChangeQuery',
        data:{
            sort:sort,
            beginDate:beginDate,
            endDate:endDate
        },
        success: function (allFilesData) {
            createDatabaseTable(allFilesData.array);
        },
        fail: function(error) {
            console.log(error); 
        }
    }); 
}

function getN(){
    // document.getElementById("getNForm").innerHTML = "";
    let parent = document.getElementById("tempQuery");
    let nForm = document.createElement("form");
    nForm.id = "getNForm";
    // let nForm = document.getElementById("getNForm");
    let nLabel = document.createElement("label").appendChild(document.createTextNode("Please enter N: "));
    let n = document.createElement("input");
    n.type = "number";
    n.min = "0";
    n.step = "1";
    n.id = "nInput";
    let submitButton = document.createElement("button");
    submitButton.appendChild(document.createTextNode("Submit"));
    submitButton.type = "submit";
    submitButton.class = "btn";

    nForm.appendChild(nLabel)
    nForm.appendChild(document.createElement("br"));
    nForm.appendChild(n);
    nForm.appendChild(document.createElement("br"));
    nForm.appendChild(submitButton);
    parent.appendChild(nForm);
}

function createShapeCount(){
    let parent = document.getElementById("tempQuery");
    // document.getElementById("shapeCountForm").innerHTML = "";
    // let shapeForm = document.getElementById("shapeCountForm");
    let shapeForm = document.createElement("form");
    shapeForm.id = "shapeCountForm";
    let selectionLabel = document.createElement("label");
    selectionLabel.appendChild(document.createTextNode("Please Choose a Shape and Range to find files: "));
    let shapeSelection = document.createElement("select");
    shapeSelection.id = "selectShapeForCount";
    let rectOption = document.createElement("option");
    rectOption.appendChild(document.createTextNode("Rectangle"));
    let pathOption = document.createElement("option");
    pathOption.appendChild(document.createTextNode("Path"));
    let circleOption = document.createElement("option");
    circleOption.appendChild(document.createTextNode("Circle"));
    let groupOption = document.createElement("option");
    groupOption.appendChild(document.createTextNode("Group"));
    shapeSelection.appendChild(rectOption);
    shapeSelection.appendChild(pathOption);
    shapeSelection.appendChild(circleOption);
    shapeSelection.appendChild(groupOption);

    let shapeLabel = document.createElement("label");
    shapeLabel.appendChild(document.createTextNode("Shape Range: "));
    let shapeRange1 = document.createElement("input");
    shapeRange1.type = "number";
    shapeRange1.min = "0";
    shapeRange1.step = "1";
    shapeRange1.id = "shapeRange1";
    let shapeRange2 = document.createElement("input");
    shapeRange2.type = "number";
    shapeRange2.min = "0";
    shapeRange2.step = "1";
    shapeRange2.id = "shapeRange2";

    shapeForm.appendChild(selectionLabel);
    shapeForm.appendChild(document.createElement("br"));
    shapeForm.appendChild(shapeSelection);
    shapeForm.appendChild(document.createElement("br"));
    shapeForm.appendChild(shapeLabel);
    shapeForm.appendChild(shapeRange1);
    shapeForm.appendChild(document.createElement("label").appendChild(document.createTextNode(" to ")));
    shapeForm.appendChild(shapeRange2);
    shapeForm.appendChild(document.createElement("br"));

    
    let submitButton = document.createElement("button");
    submitButton.appendChild(document.createTextNode("Submit"));
    submitButton.type = "submit";
    submitButton.class = "btn";
    shapeForm.appendChild(submitButton);
    parent.appendChild(shapeForm);
}

function createDateRange(id){
    // document.getElementById("dateRangeForm").innerHTML = "";
    let parent = document.getElementById("tempQuery");
    let dateForm = document.createElement("form");
    // let dateForm = document.getElementById("dateRangeForm");
    // ID 
    dateForm.id = id;
    let instructions = document.createElement("label");
    instructions.appendChild(document.createTextNode("Please select dates to view files created during a time period: "));
    let beginDate = document.createElement("input");
    let endDate = document.createElement("input");
    let to = document.createElement("label");
    to.appendChild(document.createTextNode(" to "));
    let submitButton = document.createElement("button");
    submitButton.appendChild(document.createTextNode("Submit"));
    submitButton.type = "submit";
    submitButton.class = "btn";
    // ID 
    submitButton.id = "dateRangeSubmit";
    beginDate.type = "date";
    // ID 
    beginDate.id = "beginDate";
    beginDate.value = "2000-00-00";
    endDate.type = "date";
    // ID 
    endDate.id = "endDate";
    endDate.value = "2200-00-00";
    dateForm.appendChild(instructions);
    dateForm.appendChild(document.createElement("br"));
    dateForm.appendChild(beginDate);
    dateForm.appendChild(to);
    dateForm.appendChild(endDate);
    dateForm.appendChild(submitButton);
    parent.appendChild(dateForm);
}

function createLoginPopup(){
    let popupDiv = document.getElementById("loginDIV");

    // popupDiv.style.display = "block";
    document.getElementById("loginDIV").style.display = "block";

    let loginForm = document.createElement("form");
    loginForm.class = "form-container";
    loginForm.id = "loginForm";

    let welcome = document.createElement("h2");
    welcome.appendChild(document.createTextNode("Welcome to SVG Image Viewer/Editor!"));
    
    let description = document.createElement("h5");
    description.appendChild(document.createTextNode("Please Enter your Database Login Info:"));

    let usernameLabel = document.createElement("label");
    usernameLabel.appendChild(document.createTextNode("Username:"));
    usernameLabel.for = "username";
    let usernameInput = document.createElement("input");
    usernameInput.id = "usernameInput";
    usernameInput.type = "text";
    usernameInput.placeholder = "Username";
    usernameInput.name = "username";
    // usernameInput.required;

    let passwordLabel = document.createElement("label");
    passwordLabel.appendChild(document.createTextNode("Password:"));
    passwordLabel.for = "password";
    let passwordInput = document.createElement("input");
    passwordInput.id = "passwordInput";
    passwordInput.type = "text";
    passwordInput.placeholder = "Password";
    passwordInput.name = "password";

    let dbNameLabel = document.createElement("label");
    dbNameLabel.appendChild(document.createTextNode("Database Name:"));
    dbNameLabel.for = "dbName";
    let dbNameInput = document.createElement("input");
    dbNameInput.id = "dbNameInput";
    dbNameInput.type = "text";
    dbNameInput.placeholder = "Database Name";
    dbNameInput.name = "dbName";

    let submitButton = document.createElement("button");
    submitButton.appendChild(document.createTextNode("Login"));
    submitButton.type = "submit";
    submitButton.class = "btn";
    // submitButton.onclick = "destroyLoginPopup()";

    loginForm.appendChild(welcome);
    loginForm.appendChild(document.createElement("br"));
    loginForm.appendChild(description);

    loginForm.appendChild(usernameLabel);
    loginForm.appendChild(document.createElement("br"));
    loginForm.appendChild(usernameInput);
    
    loginForm.appendChild(document.createElement("br"));
    
    loginForm.appendChild(passwordLabel);
    loginForm.appendChild(document.createElement("br"));
    loginForm.appendChild(passwordInput);
    
    loginForm.appendChild(document.createElement("br"));

    loginForm.appendChild(dbNameLabel);
    loginForm.appendChild(document.createElement("br"));
    loginForm.appendChild(dbNameInput);

    loginForm.appendChild(document.createElement("br"));
    
    loginForm.appendChild(submitButton);

    popupDiv.appendChild(loginForm);
}
function destroyLoginPopup(){
    // document.getElementById("loginDIV").innerHTML = "";
    document.getElementById("loginDIV").style.display = "none";
}

function scaleFactorSlider(){
    document.getElementById("scaleShapeForm").innerHTML = "";
    let parent = document.getElementById("scaleShapeForm");
    // Creating slider
    let container = document.createElement('div');
    container.class = "slidecontainer";

    let slider = document.createElement('input');
    slider.type = "range";
    slider.min = '0.1';
    slider.max = '5';
    slider.value = '1';
    slider.class = 'slider';
    slider.id = 'shapeScaler';
    slider.style = 'webkit-appearance: none; appearance: none; width: 100%; height: 30px; background: #d3d3d3; outline: none; opacity: 0.7; -webkit-transition: .2s; transition: opacity .2s;';

    console.log(slider);
    let scaleShape = document.createElement("button");
    scaleShape.type = "submit";
    scaleShape.class = "btn btn-secondary";
    scaleShape.id = "scaleShape";

    // parent.appendChild(document.createTextNode(slider.value));
    scaleShape.appendChild(document.createTextNode("Scale Shape"));
    container.appendChild(slider);
    parent.appendChild(container);
    parent.appendChild(scaleShape);
}

function circRectArray(){
    let theArray = new Array();
    theArray[0] = "Rectangle";
    theArray[1] = "Circle";
    return theArray;
}

// Shape can be either Circle, Rectangle, or Path
function addShapePanel(shape){
    document.getElementById("addShapeForm").innerHTML = "";
    let parent = document.getElementById("addShapeForm");
    
    let unitsCell = document.createElement("input");
    unitsCell.type = "text";
    unitsCell.placeholder = "UNITS";
    unitsCell.class = "form-control";
    unitsCell.id = "unitID";

    let fillCell = document.createElement("input");
    fillCell.type = "text";
    fillCell.placeholder = "FILL COLOUR";
    fillCell.class = "form-control";
    fillCell.id = "fillID";

    let addShape = document.createElement("button");
    addShape.type = "submit";
    addShape.class = "btn btn-secondary";
    addShape.id = "addShape";

    if (shape == "Circle"){
        let cxCell = document.createElement("input");
        cxCell.type = "text";
        cxCell.placeholder = "CX";
        cxCell.class = "form-control";
        cxCell.id = "cxID";
        let cyCell = document.createElement("input");
        cyCell.type = "text";
        cyCell.placeholder = "CY";
        cyCell.class = "form-control";
        cyCell.id = "cyID";
        let rCell = document.createElement("input");
        rCell.type = "text";
        rCell.placeholder = "R";
        rCell.class = "form-control";
        rCell.id = "rID";

        addShape.appendChild(document.createTextNode("Add Shape"));
        parent.appendChild(cxCell);
        parent.appendChild(cyCell);
        parent.appendChild(rCell);
        parent.appendChild(document.createElement("br"));
        parent.appendChild(unitsCell);
        parent.appendChild(document.createElement("br"));
        parent.appendChild(fillCell);
        parent.appendChild(document.createElement("br"));
        parent.appendChild(addShape);
    }
    if (shape == "Rectangle"){
        let xCell = document.createElement("input");
        xCell.type = "text";
        xCell.placeholder = "X";
        xCell.class = "form-control";
        xCell.id = "xID";
        let yCell = document.createElement("input");
        yCell.type = "text";
        yCell.placeholder = "Y";
        yCell.class = "form-control";
        yCell.id = "yID";
        let wCell = document.createElement("input");
        wCell.type = "text";
        wCell.placeholder = "WIDTH";
        wCell.class = "form-control";
        wCell.id = "wID";
        let hCell = document.createElement("input");
        hCell.type = "text";
        hCell.placeholder = "HEIGHT";
        hCell.class = "form-control";
        hCell.id = "hID";

        addShape.appendChild(document.createTextNode("Add Shape"));
        parent.appendChild(xCell);
        parent.appendChild(yCell);
        parent.appendChild(document.createElement("br"));
        parent.appendChild(wCell);
        parent.appendChild(hCell);
        parent.appendChild(document.createElement("br"));
        parent.appendChild(unitsCell);
        parent.appendChild(document.createElement("br"));
        parent.appendChild(fillCell);
        parent.appendChild(document.createElement("br"));
        parent.appendChild(addShape);
    }
}

function createEntryBox(initialValue, parentID, formName, entryBoxID){
    document.getElementById(parentID).innerHTML = "";
    let parent = document.getElementById(parentID);
    let form = document.createElement("form");
    form.ref = formName;
    form.id = formName;
    let label = document.createElement("label");
    let entryBox = document.createElement("input");
    entryBox.type = "text";
    entryBox.value = initialValue;
    entryBox.class = "form-control";
    entryBox.id = entryBoxID;
    // entryBox.placeholder = "Placeholder";
    let button = document.createElement("button");
    button.type = "submit";
    // button.class = "btn btn-secondary";
    let text = document.createTextNode("Submit");
    button.appendChild(text);
    form.appendChild(label);
    form.appendChild(entryBox);
    form.appendChild(button);
    parent.appendChild(form);
}

function createNewDropDownMenu(list, name, initial){
    let parent = document.getElementById("tempQuery");
    let menu = document.createElement("select");
    menu.id = name;
    parent.appendChild(menu);
    createDropDownMenu(list, name, initial);
}

function createDropDownMenu(list, id, initial){
    document.getElementById(id).innerHTML = "";
    let selected = document.getElementById(id);

    let initialSelection = document.createElement('option');
    initialSelection.selected = "selected";
    let initialText = document.createTextNode(initial);
    initialSelection.appendChild(initialText);
    selected.appendChild(initialSelection);

    list.forEach(function(element) {
        // console.log(element);
        let option = document.createElement('option');
        option.innerHTML = element;
        option.value = element;
        selected.appendChild(option);
    });
}

function createH4Element(text, id) {
    document.getElementById(id).innerHTML = "";
    let svgViewPanel = document.getElementById(id);
    let description = document.createTextNode(text);
    svgViewPanel.appendChild(description);
}

function downloadRequest(filename){
    $.ajax({
        type: 'get',
        url: '/downloadRequest',
        data: {
            theFile: filename
        },
        success: function (downloadData) {
            // alert(downloadData.test);
        },
        fail: function(error) {
            console.log(error); 
        }
    });
}

function createFileTable(data) {
    // let table = document.createElement('table');
    let table = document.getElementById('FileLogPanel');
    let tableBody = document.createElement('tbody');
    let rowCount = 0;
    let colCount = 0;
    if (data.length > 5+1){
        tableBody.style = "overflow-y:scroll;height:600px;display:block;";
    }
    data.forEach(function(rowData) {
      let row = document.createElement('tr');
  
      rowData.forEach(function(cellData) {
        // Image files downloadable
        if (rowCount == 0 && colCount != 0){
            let cell = document.createElement('td');
            let imgLink = document.createElement('a');
            let img = document.createElement('img');
            // let form = document.createElement('form');
            // form.id = "imageForm";
            // form.method = "post";
            // form.dataset = cellData;
            // form.action = "/downloadRequest";
            // form.enctype = "multipart/form-data";
            img.src = cellData;
            img.id = "fileTableImage";
            let onAClick = "downloadRequest(\"" + cellData + "\")";
            imgLink.setAttribute('onclick', onAClick);
            imgLink.href = cellData;
            imgLink.download = cellData;
            imgLink.id = "fileTable";
            imgLink.appendChild(img);
            // form.appendChild(imgLink);
            cell.appendChild(imgLink);
            // console.log(imgLink);
            row.appendChild(cell);
        }
        // Text filename downloadable
        else if (rowCount == 1 && colCount != 0){
            let cell = document.createElement('td');
            let imgLink = document.createElement('a');
            let text = document.createTextNode(cellData);
            // let onAClick = "downloadRequest(\"" + cellData + "\")";
            // imgLink.setAttribute('onclick', onAClick);
            imgLink.id = "imgHrefDownload";
            let onAClick = "downloadRequest(\"" + cellData + "\")";
            imgLink.setAttribute('onclick', onAClick);
            imgLink.href = cellData;
            imgLink.download = cellData;
            imgLink.appendChild(text);
            cell.appendChild(imgLink);
            row.appendChild(cell);
        }
        else if ( rowCount < 7) {
            let cell = document.createElement('td');
            cell.appendChild(document.createTextNode(cellData));
            row.appendChild(cell);
        }
        rowCount++;
      });
      rowCount = 0;
      colCount++;
      tableBody.appendChild(row);
    });
    if (data.length == 1){
        let cell = document.createElement('td');
        cell.appendChild(document.createTextNode("No Files"));
        cell.colSpan = "7";
        tableBody.appendChild(cell);
    }
    table.appendChild(tableBody);
    // document.body.appendChild(table);
  }

  function createSVGViewPanel(tableData) {
    // let table = document.createElement('table');
    // Clears the old SVG View Panel for each time that a new one is selected
    document.getElementById('SVGViewPanel').innerHTML = "";
    let table = document.getElementById('SVGViewPanel');
    let SVG = document.createElement('tbody');
    let rowCount = 0;
    let colCount = 0;
    SVG.style = "overflow-y:scroll;height:1200px;overflow-x:scroll;width:99%;display:block;";

    tableData.forEach(function(rowData) {
        let row = document.createElement('tr');
        if (rowCount == 0){
            let element = document.createElement('tr');
            let th = document.createElement('th');
            let imgLink = document.createElement('a');
            let img = document.createElement('img');
            img.src = rowData;
            // Setting the image size to 800px specified by the assignment description
            img.style = "width : 800px; height: auto;";
            imgLink.href = rowData;
            imgLink.download = rowData;
            imgLink.appendChild(img);
            th.colSpan = "3";
            th.align = "center";
            th.appendChild(imgLink);
            element.appendChild(th);
            SVG.appendChild(element);
        }
        rowData.forEach(function(cell) {
            if (rowCount != 0){
                let element = document.createElement('td');
                element.appendChild(document.createTextNode(cell));
                element.colSpan = getViewPanelColSpan(rowCount, colCount);
                // element.align = "center";
                row.appendChild(element);
                colCount++;         
            }
        });

        SVG.appendChild(row);
        colCount = 0;
        rowCount++;
    });
  
    table.appendChild(SVG);
    // document.body.appendChild(table);
  }

function getViewPanelColSpan(rowCount, colCount){
    let colSpan;
    if (rowCount == 1 && colCount == 0){
        // Table 
        colSpan = "1";
    }
    else if (rowCount == 1 && colCount == 1){
        // Description
        colSpan = "2";
    }
    else if (rowCount == 2 && colCount == 0){
        // Title Text
        colSpan = "1";
    }
    else if (rowCount == 2 && colCount == 1){
        // Description Text
        colSpan = "2";
    }
    else if (rowCount >= 3 && colCount == 0){
        // Component
        colSpan = "0.5";
    }
    else if (rowCount >= 3 && colCount == 1){
        // Summary 
        colSpan = "1";
    }
    else if (rowCount >= 3 && colCount == 2){
        // Other Attributes
        colSpan = "0.5";
    }
    return colSpan;
}