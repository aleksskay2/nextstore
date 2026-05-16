import { useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";
import ProductList from "./pages/Product/ProductList";

import Home from "./pages/Home";
import "./App.css";
import AddProductUser from "./pages/Product/AddProductUser";
import Header from "./components/Header/Header";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import MyProducts from "./pages/MyProducts/MyProducts";
import PrivateRoute from "./components/PrivateRoute";
import EditUserProduct from "./pages/Product/EditUserProduct";
import EditOwnerProduct from "./pages/Product/EditOwnerProduct";
import Layout from "./components/Layout";
import Profile from "./pages/Profile/Profile";
import ProductDetail from "./pages/ProductDetail/ProductDetail";
import BookMark from "./pages/bookmark/Bookmark";
import ChatPage from "./pages/Message/ChatPage";
import MessagePage from "./pages/Message/MessagePage";
import { useEffect } from "react";
import useStore from "./components/store/store";
import ActivatePage from "./pages/Registration/ActivatePage";
import SellerProductPage from "./pages/Product/SellerProductPage";
import RegionChat from "./components/RegionChat";
import PrivateChat from "./components/PrivateChat/PrivateChat"
import PrivateDialogMessage from "./pages/Message/PrivateDialogMessage";
import UserProfilePage from "./pages/Profile/UserProfilePage";
import EditUserProfile from './pages/Profile/EditUserProfile'
import GroupsPage from "./components/Group/GroupsPage";
import GroupChat from "./components/Group/GroupChat";
import { useAppStore } from "./components/store/appStore";
import { ToastContainer } from "react-toastify";
import GroupMembersPage from "./components/Group/GroupMembersPage";
import EditGroupPage from "./components/Group/EditGroupPage";
import useGlobalSocket from "./hooks/useGlobalSocket";

import "react-toastify/dist/ReactToastify.css";
import CreateStory from "./components/Story/CreateStory";
import StoriesViewer from "./components/Story/StoriesViewer";
import StoryViewerFeed from "./components/Story/StoryViewerFeed";
import { useMessageChatsStore } from "./components/store/useMessageChatsStore";
import UnreadMessage from "./pages/Message/UnreadMessage";



function App() {
     const { chats, loadChats, loading } = useMessageChatsStore();
    // запустить WS только если user есть
   
    const user = useAppStore(s => s.user); // подписка на store

    useEffect(() => {
        useAppStore.getState().fetchUser(); // загрузка текущего пользователя
        if (user)
        loadChats()
    }, [user]);
 
   
    useGlobalSocket(user?.id);

    

       
    


    return (
        <>

            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                pauseOnHover/>
             <Router>
            <Layout />
            <Routes>
                <Route path="/" element={<ProductList />} />
                <Route path="/message-page" element={<MessagePage />} />

                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/add-product" element={<AddProductUser />} />
                <Route
                    path="/edit-user-product/:id"
                    element={<EditUserProduct />}
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="/bookmarks" element={<BookMark />} />
                <Route path="/activate" element={<ActivatePage />} />
                <Route path="/seller/:id" element={<SellerProductPage />} />

                <Route path="/messages" element={<MessagePage />} />
                {/* <Route path="/chat/:productId" element={<ChatPage />} /> */}

                <Route path="/chat/product/:productId/:companionId" element={<ChatPage />} />
                
                <Route path="/region-chat/:regionId" element={<RegionChat />} />
                <Route path="/chat/private/:targetId" element={<PrivateChat />} />
                {/* <Route path="/private-chat/dialogs" element={<PrivateDialogMessage />} /> */}
                <Route path="/private-chat/:id" element={<PrivateDialogMessage />} />
                
                <Route path="/group" element={<GroupsPage />} />
                <Route path="/groups/:groupId" element={<GroupChat />} />
                <Route path="/groups/edit/:groupId" element={<EditGroupPage />} />
                
                <Route path="/groups/:groupId/members" element={<GroupMembersPage />}
                />




                <Route path="/create-story" element={<CreateStory/>}/>
                <Route path="/story-view" element={<StoriesViewer/>}/>

                
                <Route path="/user/:userId" element={<UserProfilePage />} />
                <Route path="/user/:userId/edit" element={<EditUserProfile />} />

                <Route
                    path="my-products"
                    element={
                        <PrivateRoute>
                            <MyProducts />
                        </PrivateRoute>
                    }
                />

                <Route
                    path="/edit-product/:id"
                    element={
                        <PrivateRoute>
                            <EditOwnerProduct />
                        </PrivateRoute>
                    }
                ></Route>
            </Routes>
            
        </Router>

        <StoriesViewer /> {/* ← ВСЕГДА СУЩЕСТВУЕТ */}
        <StoryViewerFeed />
     
        </>
       
    );
}

export default App;
