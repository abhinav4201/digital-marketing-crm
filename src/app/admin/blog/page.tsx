"use client";
import { useState } from "react";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../providers/AuthProvider";

// CHANGED: Added fields for SVG and YouTube Video ID.

const CreateBlogPage = () => {
  const { isAdmin } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [svg, setSvg] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setSlug(createSlug(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("You are not authorized to create a blog post.");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "blogs"), {
        title,
        content,
        slug,
        svg,
        youtubeId,
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
      setTitle("");
      setContent("");
      setSlug("");
      setSvg("");
      setYoutubeId("");
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return <p>Unauthorized</p>;
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white p-4 sm:p-8'>
      <div className='max-w-4xl mx-auto'>
        <h1 className='text-3xl sm:text-4xl font-bold mb-6'>
          Create New Blog Post
        </h1>
        {success && (
          <p className='text-green-500 mb-4'>Blog post created successfully!</p>
        )}
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div>
            <label
              htmlFor='title'
              className='block text-sm font-medium text-gray-300'
            >
              Title
            </label>
            <input
              type='text'
              id='title'
              value={title}
              onChange={handleTitleChange}
              className='mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-3 focus:ring-cyan-500 focus:border-cyan-500'
              required
            />
          </div>
          <div>
            <label
              htmlFor='slug'
              className='block text-sm font-medium text-gray-300'
            >
              Slug
            </label>
            <input
              type='text'
              id='slug'
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className='mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm p-3'
              readOnly
            />
          </div>
          <div>
            <label
              htmlFor='svg'
              className='block text-sm font-medium text-gray-300'
            >
              SVG Image Code
            </label>
            <textarea
              id='svg'
              rows={6}
              value={svg}
              onChange={(e) => setSvg(e.target.value)}
              className='mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-3 font-mono text-sm focus:ring-cyan-500 focus:border-cyan-500'
              placeholder='<svg>...</svg>'
            ></textarea>
          </div>
          <div>
            <label
              htmlFor='youtubeId'
              className='block text-sm font-medium text-gray-300'
            >
              YouTube Video ID
            </label>
            <input
              type='text'
              id='youtubeId'
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              className='mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-3 focus:ring-cyan-500 focus:border-cyan-500'
              placeholder='e.g., dQw4w9WgXcQ'
            />
          </div>
          <div>
            <label
              htmlFor='content'
              className='block text-sm font-medium text-gray-300'
            >
              Content (Markdown supported)
            </label>
            <textarea
              id='content'
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className='mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-3 focus:ring-cyan-500 focus:border-cyan-500'
              required
            ></textarea>
          </div>
          <div>
            <button
              type='submit'
              disabled={submitting}
              className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-500'
            >
              {submitting ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBlogPage;
